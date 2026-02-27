import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const JoinWorkspace = () => {
  const { token } = useParams<{ token: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [workspace, setWorkspace] = useState<{ id: string; name: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    const fetchWorkspace = async () => {
      const { data } = await supabase
        .from('workspaces')
        .select('id, name')
        .eq('invite_link_token', token)
        .eq('invite_link_enabled', true)
        .maybeSingle();
      setWorkspace(data);
      setLoading(false);
    };
    if (token) fetchWorkspace();
  }, [token]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate(`/auth?redirect=/join/${token}`);
    }
  }, [authLoading, user, token, navigate]);

  const handleJoin = async () => {
    if (!workspace || !user) return;
    setJoining(true);
    const { error } = await supabase.from('workspace_members').insert({
      workspace_id: workspace.id,
      user_id: user.id,
      role: 'editor',
    });
    setJoining(false);
    if (error) {
      if (error.code === '23505') {
        toast({ title: 'Already a member' });
      } else {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
        return;
      }
    }
    navigate('/');
  };

  if (loading || authLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground">Loading...</div>;
  }

  if (!workspace) {
    return <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground">Invalid or disabled invite link.</div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6 text-center">
        <h1 className="text-2xl font-bold text-foreground">Join workspace</h1>
        <p className="text-muted-foreground">You've been invited to join <strong>{workspace.name}</strong></p>
        <Button onClick={handleJoin} className="w-full" disabled={joining}>
          {joining ? 'Joining...' : 'Join workspace'}
        </Button>
      </div>
    </div>
  );
};

export default JoinWorkspace;
