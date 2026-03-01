// src/hooks/useWorkspaceData.ts
import { useState, useEffect } from "react";
import { workspaces, notes } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export type DbWorkspace = {
  id: string;
  name: string;
  createdAt: string;
  owner_id: string;
  invite_link_enabled: boolean;
  invite_link_token: string;
  
};

export type DbNote = {
  id: string;
  title: string;
  content: string;
  workspaceId: string;
};

export const useWorkspaceData = () => {
  const { user } = useAuth();
  const [workspacesList, setWorkspacesList] = useState<DbWorkspace[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);
  const [notesList, setNotesList] = useState<DbNote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    loadWorkspaces();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);
  
  const loadWorkspaces = async () => {
    try {
      const data = await workspaces.getAll();
      setWorkspacesList(data);
      if (!activeWorkspaceId && data.length) setActiveWorkspaceId(data[0].id);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadNotes = async (workspaceId: string) => {
    try {
      const data = await notes.getAll(workspaceId);
      setNotesList(data);
    } catch (err) {
      console.error(err);
    }
  };

  return {
    workspaces: workspacesList,
    activeWorkspaceId,
    setActiveWorkspaceId,
    notes: notesList,
    loadNotes,
    loading,
  };
};