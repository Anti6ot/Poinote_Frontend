import { create } from 'zustand';

export type BlockType = 'paragraph' | 'heading1' | 'heading2' | 'heading3' | 'todo' | 'bullet' | 'divider' | 'page';

export interface Block {
  id: string;
  type: BlockType;
  content: string;
  checked?: boolean;
  linkedPageId?: string; // for 'page' block type
}

export interface Page {
  id: string;
  parentId: string | null;
  title: string;
  icon: string;
  blocks: Block[];
  createdAt: number;
  updatedAt: number;
}

interface WorkspaceState {
  pages: Page[];
  activePageId: string | null;
  sidebarOpen: boolean;
  addPage: (parentId?: string | null) => string;
  deletePage: (id: string) => void;
  setActivePage: (id: string) => void;
  updatePageTitle: (id: string, title: string) => void;
  updatePageIcon: (id: string, icon: string) => void;
  addBlock: (pageId: string, afterBlockId: string | null, type?: BlockType) => string;
  updateBlock: (pageId: string, blockId: string, updates: Partial<Block>) => void;
  deleteBlock: (pageId: string, blockId: string) => void;
  toggleSidebar: () => void;
  addSubPageBlock: (pageId: string, afterBlockId: string | null) => string;
  getPageBreadcrumbs: (pageId: string) => Page[];
  getChildPages: (parentId: string | null) => Page[];
}

const uid = () => Math.random().toString(36).slice(2, 10);

const PAGE_ICONS = ['📄', '📝', '📋', '📌', '📎', '🗂️', '💡', '⭐', '🎯', '📊'];
const randomIcon = () => PAGE_ICONS[Math.floor(Math.random() * PAGE_ICONS.length)];

const createDefaultPage = (): Page => ({
  id: uid(),
  title: 'Getting Started',
  icon: '👋',
  parentId: null,
  createdAt: Date.now(),
  updatedAt: Date.now(),
  blocks: [
    { id: uid(), type: 'heading1' as BlockType, content: 'Welcome to your workspace' },
    { id: uid(), type: 'paragraph' as BlockType, content: 'This is your personal workspace. Start typing to add content, or use the slash command (/) to insert different block types.' },
    { id: uid(), type: 'heading2' as BlockType, content: 'Quick tips' },
    { id: uid(), type: 'todo' as BlockType, content: 'Try typing "/" to see available block types', checked: false },
    { id: uid(), type: 'todo' as BlockType, content: 'Press Enter to create a new block', checked: false },
    { id: uid(), type: 'todo' as BlockType, content: 'Click the + button in the sidebar to add pages', checked: false },
    { id: uid(), type: 'bullet' as BlockType, content: 'Use headings to organize your content' },
    { id: uid(), type: 'bullet' as BlockType, content: 'Check off todos as you complete them' },
    { id: uid(), type: 'paragraph' as BlockType, content: '' },
  ],
});

const defaultPage = createDefaultPage();

export const useWorkspace = create<WorkspaceState>((set, get) => ({
  pages: [defaultPage],
  activePageId: defaultPage.id,
  sidebarOpen: true,

  getChildPages: (parentId) => {
    return get().pages.filter(p => p.parentId === parentId);
  },

  getPageBreadcrumbs: (pageId) => {
    const { pages } = get();
    const crumbs: Page[] = [];
    let current = pages.find(p => p.id === pageId);
    while (current) {
      crumbs.unshift(current);
      current = current.parentId ? pages.find(p => p.id === current!.parentId) : undefined;
    }
    return crumbs;
  },

  addPage: (parentId = null) => {
    const newPage: Page = {
      id: uid(),
      parentId,
      title: '',
      icon: randomIcon(),
      blocks: [{ id: uid(), type: 'paragraph', content: '' }],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    set(state => ({
      pages: [...state.pages, newPage],
      activePageId: newPage.id,
    }));
    return newPage.id;
  },

  deletePage: (id) => {
    const { pages, activePageId } = get();
    // Collect all descendant IDs
    const toDelete = new Set<string>();
    const collect = (pid: string) => {
      toDelete.add(pid);
      pages.filter(p => p.parentId === pid).forEach(p => collect(p.id));
    };
    collect(id);

    const filtered = pages.filter(p => !toDelete.has(p.id));
    if (filtered.length === 0) return; // don't delete everything

    // Also remove page blocks that reference deleted pages
    const cleaned = filtered.map(p => ({
      ...p,
      blocks: p.blocks.filter(b => !(b.type === 'page' && b.linkedPageId && toDelete.has(b.linkedPageId))),
    })).map(p => ({
      ...p,
      blocks: p.blocks.length === 0 ? [{ id: uid(), type: 'paragraph' as BlockType, content: '' }] : p.blocks,
    }));

    set({
      pages: cleaned,
      activePageId: toDelete.has(activePageId || '') ? cleaned[0].id : activePageId,
    });
  },

  setActivePage: (id) => set({ activePageId: id }),

  updatePageTitle: (id, title) => {
    set(state => ({
      pages: state.pages.map(p => p.id === id ? { ...p, title, updatedAt: Date.now() } : p),
    }));
  },

  updatePageIcon: (id, icon) => {
    set(state => ({
      pages: state.pages.map(p => p.id === id ? { ...p, icon, updatedAt: Date.now() } : p),
    }));
  },

  addBlock: (pageId, afterBlockId, type = 'paragraph') => {
    const newId = uid();
    set(state => ({
      pages: state.pages.map(p => {
        if (p.id !== pageId) return p;
        const newBlock: Block = { id: newId, type, content: '', ...(type === 'todo' ? { checked: false } : {}) };
        if (!afterBlockId) return { ...p, blocks: [...p.blocks, newBlock], updatedAt: Date.now() };
        const idx = p.blocks.findIndex(b => b.id === afterBlockId);
        const blocks = [...p.blocks];
        blocks.splice(idx + 1, 0, newBlock);
        return { ...p, blocks, updatedAt: Date.now() };
      }),
    }));
    return newId;
  },

  addSubPageBlock: (pageId, afterBlockId) => {
    // Create the subpage
    const subPageId = uid();
    const blockId = uid();
    const subPage: Page = {
      id: subPageId,
      parentId: pageId,
      title: '',
      icon: randomIcon(),
      blocks: [{ id: uid(), type: 'paragraph', content: '' }],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    // Create a page block linking to it
    set(state => ({
      pages: [...state.pages, subPage].map(p => {
        if (p.id !== pageId) return p;
        const newBlock: Block = { id: blockId, type: 'page', content: '', linkedPageId: subPageId };
        if (!afterBlockId) return { ...p, blocks: [...p.blocks, newBlock], updatedAt: Date.now() };
        const idx = p.blocks.findIndex(b => b.id === afterBlockId);
        const blocks = [...p.blocks];
        blocks.splice(idx + 1, 0, newBlock);
        return { ...p, blocks, updatedAt: Date.now() };
      }),
      activePageId: subPageId,
    }));
    return blockId;
  },

  updateBlock: (pageId, blockId, updates) => {
    set(state => ({
      pages: state.pages.map(p => {
        if (p.id !== pageId) return p;
        return {
          ...p,
          blocks: p.blocks.map(b => b.id === blockId ? { ...b, ...updates } : b),
          updatedAt: Date.now(),
        };
      }),
    }));
  },

  deleteBlock: (pageId, blockId) => {
    set(state => ({
      pages: state.pages.map(p => {
        if (p.id !== pageId) return p;
        const blocks = p.blocks.filter(b => b.id !== blockId);
        if (blocks.length === 0) blocks.push({ id: uid(), type: 'paragraph', content: '' });
        return { ...p, blocks, updatedAt: Date.now() };
      }),
    }));
  },

  toggleSidebar: () => set(state => ({ sidebarOpen: !state.sidebarOpen })),
}));
