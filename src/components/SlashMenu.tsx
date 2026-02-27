import { BlockType } from '@/store/workspace';
import { Type, Heading1, Heading2, Heading3, CheckSquare, List, Minus } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

interface SlashMenuItem {
  type: BlockType;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const items: SlashMenuItem[] = [
  { type: 'paragraph', label: 'Text', description: 'Plain text block', icon: <Type size={18} /> },
  { type: 'heading1', label: 'Heading 1', description: 'Large heading', icon: <Heading1 size={18} /> },
  { type: 'heading2', label: 'Heading 2', description: 'Medium heading', icon: <Heading2 size={18} /> },
  { type: 'heading3', label: 'Heading 3', description: 'Small heading', icon: <Heading3 size={18} /> },
  { type: 'todo', label: 'To-do', description: 'Checkbox item', icon: <CheckSquare size={18} /> },
  { type: 'bullet', label: 'Bullet list', description: 'Unordered list item', icon: <List size={18} /> },
  { type: 'divider', label: 'Divider', description: 'Horizontal line', icon: <Minus size={18} /> },
];

interface SlashMenuProps {
  filter: string;
  onSelect: (type: BlockType) => void;
  onClose: () => void;
}

const SlashMenu = ({ filter, onSelect, onClose }: SlashMenuProps) => {
  const [activeIdx, setActiveIdx] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

  const filtered = items.filter(i =>
    i.label.toLowerCase().includes(filter.toLowerCase())
  );

  useEffect(() => {
    setActiveIdx(0);
  }, [filter]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIdx(i => (i + 1) % filtered.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIdx(i => (i - 1 + filtered.length) % filtered.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filtered[activeIdx]) onSelect(filtered[activeIdx].type);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [activeIdx, filtered, onSelect, onClose]);

  if (filtered.length === 0) return null;

  return (
    <div
      ref={menuRef}
      className="absolute left-0 top-full mt-1 z-50 w-64 bg-notion-slash-bg border border-border rounded-lg shadow-lg animate-fade-in overflow-hidden"
    >
      <div className="px-2 py-1.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
        Basic blocks
      </div>
      {filtered.map((item, idx) => (
        <button
          key={item.type}
          onClick={() => onSelect(item.type)}
          onMouseEnter={() => setActiveIdx(idx)}
          className={`
            flex items-center gap-3 w-full px-2 py-2 text-left text-sm transition-colors
            ${idx === activeIdx ? 'bg-notion-slash-hover' : ''}
          `}
        >
          <div className="flex items-center justify-center w-9 h-9 rounded-md border border-border bg-background text-notion-icon">
            {item.icon}
          </div>
          <div>
            <div className="font-medium text-foreground">{item.label}</div>
            <div className="text-xs text-muted-foreground">{item.description}</div>
          </div>
        </button>
      ))}
    </div>
  );
};

export default SlashMenu;
