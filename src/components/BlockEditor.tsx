import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { useWorkspaceCtx } from '@/hooks/useWorkspaceCtx';
import type { DbBlock } from '@/hooks/useWorkspaceData';
import { GripVertical, Plus, Check, Circle, FileText } from 'lucide-react';
import SlashMenu from './SlashMenu';

type BlockType = 'paragraph' | 'heading1' | 'heading2' | 'heading3' | 'todo' | 'bullet' | 'divider' | 'page';

interface BlockEditorProps {
  block: DbBlock;
  pageId: string;
  onFocusBlock?: (blockId: string) => void;
  focusThisBlock?: boolean;
}

const BlockEditor = ({ block, pageId, onFocusBlock, focusThisBlock }: BlockEditorProps) => {
  const { updateBlock, addBlock, deleteBlock, addSubPageBlock, pages, setActivePageId } = useWorkspaceCtx();
  const ref = useRef<HTMLDivElement>(null);
  const [showSlash, setShowSlash] = useState(false);
  const [slashFilter, setSlashFilter] = useState('');
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    if (focusThisBlock && ref.current) {
      ref.current.focus();
      const range = document.createRange();
      const sel = window.getSelection();
      range.selectNodeContents(ref.current);
      range.collapse(false);
      sel?.removeAllRanges();
      sel?.addRange(range);
    }
  }, [focusThisBlock]);

  const handleInput = () => {
    if (!ref.current) return;
    const text = ref.current.innerText;
    updateBlock(pageId, block.id, { content: text });

    if (text.endsWith('/')) {
      setShowSlash(true);
      setSlashFilter('');
    } else if (showSlash) {
      const slashIdx = text.lastIndexOf('/');
      if (slashIdx >= 0) {
        setSlashFilter(text.slice(slashIdx + 1));
      } else {
        setShowSlash(false);
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (showSlash) {
      if (e.key === 'Escape') {
        setShowSlash(false);
        e.preventDefault();
      }
      return;
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const newType = block.type === 'todo' ? 'todo' : block.type === 'bullet' ? 'bullet' : 'paragraph';
      addBlock(pageId, block.id, newType).then(id => {
        if (id) setTimeout(() => onFocusBlock?.(id), 50);
      });
    }

    if (e.key === 'Backspace' && ref.current?.innerText === '') {
      e.preventDefault();
      deleteBlock(pageId, block.id);
    }
  };

  const handleSlashSelect = (type: BlockType) => {
    setShowSlash(false);
    if (ref.current) {
      const text = ref.current.innerText;
      const slashIdx = text.lastIndexOf('/');
      const newText = text.slice(0, slashIdx);
      ref.current.innerText = newText;

      if (type === 'page') {
        updateBlock(pageId, block.id, { content: newText });
        addSubPageBlock(pageId, block.id);
        return;
      }

      updateBlock(pageId, block.id, { content: newText, type: type as any, ...(type === 'todo' ? { checked: false } : {}) });
    }
  };

  if (block.type === 'page') {
    const linkedPage = pages.find(p => p.id === block.linked_page_id);
    return (
      <div
        className="group relative flex items-center gap-2 py-1.5 px-2 rounded-md cursor-pointer hover:bg-notion-block-hover transition-colors"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={() => block.linked_page_id && setActivePageId(block.linked_page_id)}
      >
        <FileText size={16} className="text-notion-icon flex-shrink-0" />
        <span className="text-foreground font-medium hover:underline">
          {linkedPage?.icon} {linkedPage?.title || 'Untitled'}
        </span>
      </div>
    );
  }

  const placeholderMap: Record<string, string> = {
    paragraph: "Type '/' for commands...",
    heading1: 'Heading 1',
    heading2: 'Heading 2',
    heading3: 'Heading 3',
    todo: 'To-do',
    bullet: 'List item',
    divider: '',
    page: '',
  };

  const styleMap: Record<string, string> = {
    paragraph: 'text-base leading-relaxed',
    heading1: 'text-3xl font-bold font-serif-heading leading-tight',
    heading2: 'text-2xl font-semibold leading-snug',
    heading3: 'text-lg font-semibold leading-snug',
    todo: 'text-base leading-relaxed',
    bullet: 'text-base leading-relaxed',
    divider: '',
    page: '',
  };

  if (block.type === 'divider') {
    return <hr className="my-4 border-border" />;
  }

  return (
    <div
      className="group relative flex items-start gap-1 py-0.5 rounded-md transition-colors"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className={`flex items-center gap-0.5 pt-1 transition-opacity ${hovered ? 'opacity-100' : 'opacity-0'}`}>
        <button
          onClick={() => {
            addBlock(pageId, block.id).then(id => {
              if (id) setTimeout(() => onFocusBlock?.(id), 50);
            });
          }}
          className="p-0.5 rounded hover:bg-accent text-notion-icon hover:text-notion-icon-hover"
        >
          <Plus size={14} />
        </button>
        <button className="p-0.5 rounded hover:bg-accent text-notion-icon hover:text-notion-icon-hover cursor-grab">
          <GripVertical size={14} />
        </button>
      </div>

      {block.type === 'todo' && (
        <button
          onClick={() => updateBlock(pageId, block.id, { checked: !block.checked })}
          className={`mt-1 flex-shrink-0 w-4 h-4 rounded-sm border flex items-center justify-center transition-colors ${
            block.checked
              ? 'bg-notion-todo-checked border-notion-todo-checked'
              : 'border-muted-foreground/40 hover:border-muted-foreground'
          }`}
        >
          {block.checked && <Check size={11} className="text-primary-foreground" />}
        </button>
      )}

      {block.type === 'bullet' && (
        <div className="mt-2 flex-shrink-0">
          <Circle size={6} className="fill-foreground text-foreground" />
        </div>
      )}

      <div className="relative flex-1 min-w-0">
        <div
          ref={ref}
          contentEditable
          suppressContentEditableWarning
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          data-placeholder={placeholderMap[block.type] || ''}
          className={`
            outline-none w-full
            ${styleMap[block.type] || ''}
            ${block.type === 'todo' && block.checked ? 'line-through text-muted-foreground' : 'text-foreground'}
            empty:before:content-[attr(data-placeholder)] empty:before:text-notion-placeholder empty:before:pointer-events-none
          `}
          dangerouslySetInnerHTML={{ __html: block.content }}
        />

        {showSlash && (
          <SlashMenu
            filter={slashFilter}
            onSelect={handleSlashSelect}
            onClose={() => setShowSlash(false)}
          />
        )}
      </div>
    </div>
  );
};

export default BlockEditor;
