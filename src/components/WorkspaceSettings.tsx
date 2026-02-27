import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Settings, X, Copy, Link2, UserPlus, Trash2, Users } from 'lucide-react';
import type { DbWorkspace } from '@/hooks/useWorkspaceData';

interface Props {
  workspace: DbWorkspace;
  onClose: () => void;
  onUpdated: () => void;
}

const WorkspaceSettings = ({ workspace, onClose, onUpdated }: Props) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState(workspace.name);
  const [inviteEmail, setInviteEmail] = useState('');
  const [linkEnabled, setLinkEnabled] = useState(workspace.invite_link_enabled);
  const [members, setMembers] = useState<any[]>([]);
  const [invites, setInvites] = useState<any[]>([]);
  const isOwner = workspace.owner_id === user?.id;

  useEffect(() => {
    loadMembers();
    loadInvites();
  }, []);

  const loadMembers = async () => {
    const { data } = await supabase.from('workspace_members').select('*').eq('workspace_id', workspace.id);
    setMembers(data || []);
  };

  const loadInvites = async () => {
    const { data } = await supabase.from('workspace_invites').select('*').eq('workspace_id', workspace.id).eq('accepted', false);
    setInvites(data || []);
  };

  const handleSaveName = async () => {
    await supabase.from('workspaces').update({ name }).eq('id', workspace.id);
    toast({ title: 'Workspace renamed' });
    onUpdated();
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const { error } = await supabase.from('workspace_invites').insert({
      workspace_id: workspace.id,
      email: inviteEmail,
      invited_by: user.id,
      role: 'editor',
    });
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: `Invite sent to ${inviteEmail}` });
      setInviteEmail('');
      loadInvites();
    }
  };

  const handleToggleLink = async () => {
    const newVal = !linkEnabled;
    await supabase.from('workspaces').update({ invite_link_enabled: newVal }).eq('id', workspace.id);
    setLinkEnabled(newVal);
    onUpdated();
  };

  const copyLink = () => {
    const url = `${window.location.origin}/join/${workspace.invite_link_token}`;
    navigator.clipboard.writeText(url);
    toast({ title: 'Invite link copied!' });
  };

  const removeMember = async (memberId: string) => {
    await supabase.from('workspace_members').delete().eq('id', memberId);
    loadMembers();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-background border border-border rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Settings size={16} className="text-muted-foreground" />
            <h2 className="font-semibold text-foreground">Workspace Settings</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-accent text-muted-foreground"><X size={16} /></button>
        </div>

        <div className="p-4 space-y-6">
          {/* Name */}
          {isOwner && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Name</label>
              <div className="flex gap-2">
                <Input value={name} onChange={e => setName(e.target.value)} />
                <Button size="sm" onClick={handleSaveName}>Save</Button>
              </div>
            </div>
          )}

          {/* Invite by email */}
          {isOwner && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-1">
                <UserPlus size={14} /> Invite by email
              </label>
              <form onSubmit={handleInvite} className="flex gap-2">
                <Input type="email" placeholder="email@example.com" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} required />
                <Button size="sm" type="submit">Invite</Button>
              </form>
              {invites.length > 0 && (
                <div className="text-xs text-muted-foreground space-y-1 mt-2">
                  {invites.map(inv => (
                    <div key={inv.id} className="flex items-center justify-between">
                      <span>{inv.email} (pending)</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Invite link */}
          {isOwner && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-1">
                <Link2 size={14} /> Invite link
              </label>
              <div className="flex items-center gap-2">
                <Button variant={linkEnabled ? 'default' : 'outline'} size="sm" onClick={handleToggleLink}>
                  {linkEnabled ? 'Enabled' : 'Disabled'}
                </Button>
                {linkEnabled && (
                  <Button variant="outline" size="sm" onClick={copyLink}>
                    <Copy size={13} /> Copy link
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Members */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground flex items-center gap-1">
              <Users size={14} /> Members ({members.length})
            </label>
            <div className="space-y-1">
              {members.map(m => (
                <div key={m.id} className="flex items-center justify-between text-sm py-1">
                  <span className="text-foreground">{m.user_id === user?.id ? 'You' : m.user_id.slice(0, 8)}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground capitalize">{m.role}</span>
                    {isOwner && m.user_id !== user?.id && (
                      <button onClick={() => removeMember(m.id)} className="text-destructive hover:text-destructive/80">
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkspaceSettings;
