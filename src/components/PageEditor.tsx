import { useState, useRef, useCallback } from 'react';
import { useWorkspace } from '@/store/workspace';
import BlockEditor from './BlockEditor';
import { ChevronRight } from 'lucide-react';

const PageEditor = () => {
  const { pages, activePageId, updatePageTitle, setActivePage, getPageBreadcrumbs } = useWorkspace();
  const page = pages.find(p => p.id === activePageId);
  const [focusBlockId, setFocusBlockId] = useState<string | null>(null);
  const titleRef = useRef<HTMLDivElement>(null);

  const handleFocusBlock = useCallback((blockId: string) => {
    setFocusBlockId(blockId);
    setTimeout(() => setFocusBlockId(null), 50);
  }, []);

  if (!page) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <p>Select a page to start editing</p>
      </div>
    );
  }

  const breadcrumbs = getPageBreadcrumbs(page.id);

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-2xl mx-auto px-12 py-16">
        {/* Breadcrumbs */}
        {breadcrumbs.length > 1 && (
          <div className="flex items-center gap-1 mb-6 text-sm text-muted-foreground">
            {breadcrumbs.map((crumb, i) => (
              <div key={crumb.id} className="flex items-center gap-1">
                {i > 0 && <ChevronRight size={12} />}
                <button
                  onClick={() => setActivePage(crumb.id)}
                  className={`hover:text-foreground transition-colors ${crumb.id === page.id ? 'text-foreground font-medium' : ''}`}
                >
                  {crumb.icon} {crumb.title || 'Untitled'}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Page icon */}
        <div className="text-5xl mb-4 cursor-default">{page.icon}</div>

        {/* Title */}
        <div
          ref={titleRef}
          contentEditable
          suppressContentEditableWarning
          onInput={() => {
            if (titleRef.current) {
              updatePageTitle(page.id, titleRef.current.innerText);
            }
          }}
          data-placeholder="Untitled"
          className="text-4xl font-bold font-serif-heading text-notion-title outline-none mb-8 w-full empty:before:content-[attr(data-placeholder)] empty:before:text-notion-placeholder empty:before:pointer-events-none"
          dangerouslySetInnerHTML={{ __html: page.title }}
        />

        {/* Blocks */}
        <div className="space-y-0.5">
          {page.blocks.map(block => (
            <BlockEditor
              key={block.id}
              block={block}
              pageId={page.id}
              onFocusBlock={handleFocusBlock}
              focusThisBlock={focusBlockId === block.id}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default PageEditor;
