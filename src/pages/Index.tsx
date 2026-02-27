import Sidebar from '@/components/Sidebar';
import PageEditor from '@/components/PageEditor';
import { useWorkspaceCtx } from '@/hooks/useWorkspaceCtx';
import { Menu } from 'lucide-react';
import { useState } from 'react';

const Index = () => {
  const { loading } = useWorkspaceCtx();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background text-muted-foreground">
        Loading workspace...
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      {sidebarOpen && <Sidebar />}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center h-11 px-3 border-b border-border flex-shrink-0">
          {!sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-1.5 rounded hover:bg-accent text-notion-icon hover:text-notion-icon-hover transition-colors mr-2"
            >
              <Menu size={16} />
            </button>
          )}
        </div>
        <PageEditor />
      </div>
    </div>
  );
};

export default Index;
