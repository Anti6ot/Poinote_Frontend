import { useWorkspace } from '@/store/workspace';
import { Plus, FileText, Trash2, ChevronLeft, Search } from 'lucide-react';
import { useState } from 'react';

const Sidebar = () => {
  const { pages, activePageId, sidebarOpen, addPage, deletePage, setActivePage, toggleSidebar } = useWorkspace();
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  if (!sidebarOpen) return null;

  return (
    <aside className="w-60 h-screen flex flex-col bg-notion-sidebar border-r border-border flex-shrink-0 animate-slide-in">
      {/* Header */}
      <div className="flex items-center justify-between px-3 pt-3 pb-1">
        <span className="text-sm font-semibold text-foreground tracking-tight">Workspace</span>
        <button
          onClick={toggleSidebar}
          className="p-1 rounded hover:bg-notion-sidebar-hover text-notion-icon hover:text-notion-icon-hover transition-colors"
        >
          <ChevronLeft size={16} />
        </button>
      </div>

      {/* Search hint */}
      <div className="px-3 py-1.5">
        <div className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-notion-sidebar-hover text-notion-icon text-xs">
          <Search size={13} />
          <span>Search pages...</span>
        </div>
      </div>

      {/* Pages list */}
      <div className="flex-1 overflow-y-auto px-1.5 py-1">
        <div className="flex items-center justify-between px-2 py-1 mb-0.5">
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Pages</span>
          <button
            onClick={addPage}
            className="p-0.5 rounded hover:bg-notion-sidebar-hover text-notion-icon hover:text-notion-icon-hover transition-colors"
          >
            <Plus size={14} />
          </button>
        </div>

        {pages.map(page => (
          <div
            key={page.id}
            onMouseEnter={() => setHoveredId(page.id)}
            onMouseLeave={() => setHoveredId(null)}
            onClick={() => setActivePage(page.id)}
            className={`
              group flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer text-sm transition-colors
              ${page.id === activePageId
                ? 'bg-notion-sidebar-active text-foreground font-medium'
                : 'text-notion-sidebar-fg hover:bg-notion-sidebar-hover'
              }
            `}
          >
            <span className="text-base leading-none">{page.icon}</span>
            <span className="flex-1 truncate">{page.title || 'Untitled'}</span>
            {hoveredId === page.id && pages.length > 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); deletePage(page.id); }}
                className="p-0.5 rounded hover:bg-destructive/10 text-notion-icon hover:text-destructive transition-colors"
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-3 py-2 border-t border-border">
        <button
          onClick={addPage}
          className="flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-sm text-notion-icon hover:bg-notion-sidebar-hover hover:text-foreground transition-colors"
        >
          <Plus size={15} />
          <span>New page</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
