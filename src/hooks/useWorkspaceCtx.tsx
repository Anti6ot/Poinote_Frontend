import { createContext, useContext, ReactNode } from 'react';
import { useWorkspaceData } from '@/hooks/useWorkspaceData';

type WorkspaceContextType = ReturnType<typeof useWorkspaceData>;

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export const WorkspaceProvider = ({ children }: { children: ReactNode }) => {
  const data = useWorkspaceData();
  return <WorkspaceContext.Provider value={data}>{children}</WorkspaceContext.Provider>;
};

export const useWorkspaceCtx = () => {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error('useWorkspaceCtx must be used within WorkspaceProvider');
  return ctx;
};
