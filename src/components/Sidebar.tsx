import { useWorkspace } from '@/store/workspace';
import { Plus, Trash2, ChevronLeft, Search, ChevronRight } from 'lucide-react';
import { useState } from 'react';

interface PageTreeItemProps {
  pageId: string;
  depth: number;
}

const PageTreeItem = ({ pageId, depth }: PageTreeItemProps) => {
  const { pages, activePageId, addPage, deletePage, setActivePage } = useWorkspace();
  const page = pages.find(p => p.id === pageId);
  const children = pages.filter(p => p.parentId === pageId);
  const [hovered, setHovered] = useState(false);
  const [expanded, setExpanded] = useState(true);

  if (!page) return null;

  return (
    <div>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={() => setActivePage(page.id)}
        style={{ paddingLeft: `${8 + depth * 16}px` }}
        className={`
          group flex items-center gap-1 pr-2 py-1.5 rounded-md cursor-pointer text-sm transition-colors
          ${page.id === activePageId
            ? 'bg-notion-sidebar-active text-foreground font-medium'
            : 'text-notion-sidebar-fg hover:bg-notion-sidebar-hover'
          }
        `}
      >
        {/* Expand/collapse toggle */}
        <button
          onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
          className={`p-0.5 rounded hover:bg-notion-sidebar-hover text-notion-icon transition-all ${children.length === 0 ? 'invisible' : ''}`}
        >
          <ChevronRight size={13} className={`transition-transform ${expanded ? 'rotate-90' : ''}`} />
        </button>

        <span className="text-base leading-none">{page.icon}</span>
        <span className="flex-1 truncate ml-1">{page.title || 'Untitled'}</span>

        {hovered && (
          <div className="flex items-center gap-0.5">
            <button
              onClick={(e) => { e.stopPropagation(); addPage(page.id); }}
              className="p-0.5 rounded hover:bg-notion-sidebar-hover text-notion-icon hover:text-notion-icon-hover transition-colors"
              title="Add subpage"
            >
              <Plus size={13} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); deletePage(page.id); }}
              className="p-0.5 rounded hover:bg-destructive/10 text-notion-icon hover:text-destructive transition-colors"
            >
              <Trash2 size={13} />
            </button>
          </div>
        )}
      </div>

      {/* Children */}
      {expanded && children.length > 0 && (
        <div>
          {children.map(child => (
            <PageTreeItem key={child.id} pageId={child.id} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

const Sidebar = () => {
  const { pages, sidebarOpen, addPage, toggleSidebar } = useWorkspace();
  const rootPages = pages.filter(p => p.parentId === null);

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
            onClick={() => addPage(null)}
            className="p-0.5 rounded hover:bg-notion-sidebar-hover text-notion-icon hover:text-notion-icon-hover transition-colors"
          >
            <Plus size={14} />
          </button>
        </div>

        {rootPages.map(page => (
          <PageTreeItem key={page.id} pageId={page.id} depth={0} />
        ))}
      </div>

      {/* Footer */}
      <div className="px-3 py-2 border-t border-border">
        <button
          onClick={() => addPage(null)}
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
