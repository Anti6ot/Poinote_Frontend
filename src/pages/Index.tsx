import Sidebar from '@/components/Sidebar';
import PageEditor from '@/components/PageEditor';
import { useWorkspace } from '@/store/workspace';
import { Menu } from 'lucide-react';

const Index = () => {
  const { sidebarOpen, toggleSidebar } = useWorkspace();

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <div className="flex items-center h-11 px-3 border-b border-border flex-shrink-0">
          {!sidebarOpen && (
            <button
              onClick={toggleSidebar}
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
