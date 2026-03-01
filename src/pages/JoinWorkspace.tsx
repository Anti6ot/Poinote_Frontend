// src/pages/JoinWorkspace.tsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { workspaces } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { DbWorkspace } from "@/hooks/useWorkspaceData";

const JoinWorkspace = () => {
  const { token } = useParams<{ token: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [workspace, setWorkspace] = useState<DbWorkspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    const fetchWorkspace = async () => {
      try {
        const data = await workspaces.getAll(); // или GET /workspaces?token=...
        const ws = data.find((w) => w.invite_link_token === token && w.invite_link_enabled);
        setWorkspace(ws || null);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchWorkspace();
  }, [token]);

  const handleJoin = async () => {
    if (!workspace || !user) return;
    setJoining(true);
    try {
      await workspaces.addMember(workspace.id, user.id); // нужно добавить в client.ts
      toast({ title: "Joined workspace!" });
      navigate("/");
    } catch (err) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setJoining(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!workspace) return <div>Invalid or disabled invite link.</div>;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6 text-center">
        <h1 className="text-2xl font-bold text-foreground">Join workspace</h1>
        <p className="text-muted-foreground">You've been invited to join <strong>{workspace.name}</strong></p>
        <Button onClick={handleJoin} className="w-full" disabled={joining}>
          {joining ? "Joining..." : "Join workspace"}
        </Button>
      </div>
    </div>
  );
};

export default JoinWorkspace;