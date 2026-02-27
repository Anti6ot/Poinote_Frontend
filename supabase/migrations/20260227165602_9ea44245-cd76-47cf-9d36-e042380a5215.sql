
-- Utility: update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- ========== WORKSPACES ==========
CREATE TABLE public.workspaces (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL DEFAULT 'My Workspace',
  owner_id UUID NOT NULL,
  invite_link_token UUID DEFAULT gen_random_uuid(),
  invite_link_enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_workspaces_updated_at
  BEFORE UPDATE ON public.workspaces
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ========== WORKSPACE MEMBERS ==========
CREATE TYPE public.workspace_role AS ENUM ('owner', 'editor', 'viewer');

CREATE TABLE public.workspace_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role workspace_role NOT NULL DEFAULT 'editor',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(workspace_id, user_id)
);

ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;

-- ========== PAGES ==========
CREATE TABLE public.pages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.pages(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT '',
  icon TEXT NOT NULL DEFAULT '📄',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_pages_updated_at
  BEFORE UPDATE ON public.pages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ========== BLOCKS ==========
CREATE TYPE public.block_type AS ENUM ('paragraph', 'heading1', 'heading2', 'heading3', 'todo', 'bullet', 'divider', 'page');

CREATE TABLE public.blocks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_id UUID NOT NULL REFERENCES public.pages(id) ON DELETE CASCADE,
  type block_type NOT NULL DEFAULT 'paragraph',
  content TEXT NOT NULL DEFAULT '',
  checked BOOLEAN DEFAULT false,
  linked_page_id UUID REFERENCES public.pages(id) ON DELETE SET NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_blocks_updated_at
  BEFORE UPDATE ON public.blocks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ========== WORKSPACE INVITES ==========
CREATE TABLE public.workspace_invites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role workspace_role NOT NULL DEFAULT 'editor',
  invited_by UUID NOT NULL,
  accepted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(workspace_id, email)
);

ALTER TABLE public.workspace_invites ENABLE ROW LEVEL SECURITY;

-- ========== SECURITY DEFINER: check membership ==========
CREATE OR REPLACE FUNCTION public.is_workspace_member(_user_id UUID, _workspace_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE user_id = _user_id AND workspace_id = _workspace_id
  );
$$;

CREATE OR REPLACE FUNCTION public.is_workspace_owner(_user_id UUID, _workspace_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE user_id = _user_id AND workspace_id = _workspace_id AND role = 'owner'
  );
$$;

-- ========== RLS POLICIES ==========

-- Workspaces: members can read, owner can update/delete
CREATE POLICY "Members can view workspace"
  ON public.workspaces FOR SELECT
  USING (public.is_workspace_member(auth.uid(), id));

CREATE POLICY "Auth users can create workspace"
  ON public.workspaces FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owner can update workspace"
  ON public.workspaces FOR UPDATE
  USING (public.is_workspace_owner(auth.uid(), id));

CREATE POLICY "Owner can delete workspace"
  ON public.workspaces FOR DELETE
  USING (public.is_workspace_owner(auth.uid(), id));

-- Workspace members: members can view, owner manages
CREATE POLICY "Members can view members"
  ON public.workspace_members FOR SELECT
  USING (public.is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Owner can add members"
  ON public.workspace_members FOR INSERT
  WITH CHECK (public.is_workspace_owner(auth.uid(), workspace_id) OR auth.uid() = user_id);

CREATE POLICY "Owner can remove members"
  ON public.workspace_members FOR DELETE
  USING (public.is_workspace_owner(auth.uid(), workspace_id) OR auth.uid() = user_id);

-- Pages: workspace members can CRUD
CREATE POLICY "Members can view pages"
  ON public.pages FOR SELECT
  USING (public.is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Members can create pages"
  ON public.pages FOR INSERT
  WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Members can update pages"
  ON public.pages FOR UPDATE
  USING (public.is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Members can delete pages"
  ON public.pages FOR DELETE
  USING (public.is_workspace_member(auth.uid(), workspace_id));

-- Blocks: workspace members can CRUD (through page's workspace)
CREATE OR REPLACE FUNCTION public.is_page_workspace_member(_user_id UUID, _page_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.pages p
    JOIN public.workspace_members wm ON wm.workspace_id = p.workspace_id
    WHERE p.id = _page_id AND wm.user_id = _user_id
  );
$$;

CREATE POLICY "Members can view blocks"
  ON public.blocks FOR SELECT
  USING (public.is_page_workspace_member(auth.uid(), page_id));

CREATE POLICY "Members can create blocks"
  ON public.blocks FOR INSERT
  WITH CHECK (public.is_page_workspace_member(auth.uid(), page_id));

CREATE POLICY "Members can update blocks"
  ON public.blocks FOR UPDATE
  USING (public.is_page_workspace_member(auth.uid(), page_id));

CREATE POLICY "Members can delete blocks"
  ON public.blocks FOR DELETE
  USING (public.is_page_workspace_member(auth.uid(), page_id));

-- Workspace invites
CREATE POLICY "Members can view invites"
  ON public.workspace_invites FOR SELECT
  USING (public.is_workspace_member(auth.uid(), workspace_id) OR email = (SELECT email FROM auth.users WHERE id = auth.uid()));

CREATE POLICY "Owner can create invites"
  ON public.workspace_invites FOR INSERT
  WITH CHECK (public.is_workspace_owner(auth.uid(), workspace_id));

CREATE POLICY "Owner can delete invites"
  ON public.workspace_invites FOR DELETE
  USING (public.is_workspace_owner(auth.uid(), workspace_id));

CREATE POLICY "Invited user can update invite"
  ON public.workspace_invites FOR UPDATE
  USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- ========== Auto-create workspace on signup ==========
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_workspace_id UUID;
BEGIN
  INSERT INTO public.workspaces (name, owner_id)
  VALUES ('My Workspace', NEW.id)
  RETURNING id INTO new_workspace_id;

  INSERT INTO public.workspace_members (workspace_id, user_id, role)
  VALUES (new_workspace_id, NEW.id, 'owner');

  -- Accept any pending invites
  INSERT INTO public.workspace_members (workspace_id, user_id, role)
  SELECT wi.workspace_id, NEW.id, wi.role
  FROM public.workspace_invites wi
  WHERE wi.email = NEW.email AND wi.accepted = false
  ON CONFLICT (workspace_id, user_id) DO NOTHING;

  UPDATE public.workspace_invites
  SET accepted = true
  WHERE email = NEW.email AND accepted = false;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Allow anyone to read workspace by invite link token (for join page)
CREATE POLICY "Anyone can read workspace by invite link"
  ON public.workspaces FOR SELECT
  USING (invite_link_enabled = true);
