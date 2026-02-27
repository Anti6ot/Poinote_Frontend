import { create } from 'zustand';

export type BlockType = 'paragraph' | 'heading1' | 'heading2' | 'heading3' | 'todo' | 'bullet' | 'divider';

export interface Block {
  id: string;
  type: BlockType;
  content: string;
  checked?: boolean;
}

export interface Page {
  id: string;
  title: string;
  icon: string;
  blocks: Block[];
  createdAt: number;
  updatedAt: number;
}

interface WorkspaceState {
  pages: Page[];
  activePageId: string | null;
  sidebarOpen: boolean;
  addPage: () => string;
  deletePage: (id: string) => void;
  setActivePage: (id: string) => void;
  updatePageTitle: (id: string, title: string) => void;
  updatePageIcon: (id: string, icon: string) => void;
  addBlock: (pageId: string, afterBlockId: string | null, type?: BlockType) => string;
  updateBlock: (pageId: string, blockId: string, updates: Partial<Block>) => void;
  deleteBlock: (pageId: string, blockId: string) => void;
  toggleSidebar: () => void;
}

const uid = () => Math.random().toString(36).slice(2, 10);

const PAGE_ICONS = ['📄', '📝', '📋', '📌', '📎', '🗂️', '💡', '⭐', '🎯', '📊'];
const randomIcon = () => PAGE_ICONS[Math.floor(Math.random() * PAGE_ICONS.length)];

const createDefaultPage = (): Page => ({
  id: uid(),
  title: 'Getting Started',
  icon: '👋',
  createdAt: Date.now(),
  updatedAt: Date.now(),
  blocks: [
    { id: uid(), type: 'heading1' as BlockType, content: 'Welcome to your workspace' },
    { id: uid(), type: 'paragraph' as BlockType, content: 'This is your personal workspace. Start typing to add content, or use the slash command (/) to insert different block types.' },
    { id: uid(), type: 'heading2' as BlockType, content: 'Quick tips' },
    { id: uid(), type: 'todo' as BlockType, content: 'Try typing "/" to see available block types', checked: false },
    { id: uid(), type: 'todo' as BlockType, content: 'Press Enter to create a new block', checked: false },
    { id: uid(), type: 'todo' as BlockType, content: 'Click the + button in the sidebar to add pages', checked: false },
    { id: uid(), type: 'bullet' as BlockType, content: 'Use headings to organize your content' },
    { id: uid(), type: 'bullet' as BlockType, content: 'Check off todos as you complete them' },
    { id: uid(), type: 'paragraph' as BlockType, content: '' },
  ],
});

const defaultPage = createDefaultPage();

export const useWorkspace = create<WorkspaceState>((set, get) => ({
  pages: [defaultPage],
  activePageId: defaultPage.id,
  sidebarOpen: true,

  addPage: () => {
    const newPage: Page = {
      id: uid(),
      title: '',
      icon: randomIcon(),
      blocks: [{ id: uid(), type: 'paragraph', content: '' }],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    set(state => ({
      pages: [...state.pages, newPage],
      activePageId: newPage.id,
    }));
    return newPage.id;
  },

  deletePage: (id) => {
    const { pages, activePageId } = get();
    if (pages.length <= 1) return;
    const filtered = pages.filter(p => p.id !== id);
    set({
      pages: filtered,
      activePageId: activePageId === id ? filtered[0].id : activePageId,
    });
  },

  setActivePage: (id) => set({ activePageId: id }),

  updatePageTitle: (id, title) => {
    set(state => ({
      pages: state.pages.map(p => p.id === id ? { ...p, title, updatedAt: Date.now() } : p),
    }));
  },

  updatePageIcon: (id, icon) => {
    set(state => ({
      pages: state.pages.map(p => p.id === id ? { ...p, icon, updatedAt: Date.now() } : p),
    }));
  },

  addBlock: (pageId, afterBlockId, type = 'paragraph') => {
    const newId = uid();
    set(state => ({
      pages: state.pages.map(p => {
        if (p.id !== pageId) return p;
        const newBlock: Block = { id: newId, type, content: '', ...(type === 'todo' ? { checked: false } : {}) };
        if (!afterBlockId) return { ...p, blocks: [...p.blocks, newBlock], updatedAt: Date.now() };
        const idx = p.blocks.findIndex(b => b.id === afterBlockId);
        const blocks = [...p.blocks];
        blocks.splice(idx + 1, 0, newBlock);
        return { ...p, blocks, updatedAt: Date.now() };
      }),
    }));
    return newId;
  },

  updateBlock: (pageId, blockId, updates) => {
    set(state => ({
      pages: state.pages.map(p => {
        if (p.id !== pageId) return p;
        return {
          ...p,
          blocks: p.blocks.map(b => b.id === blockId ? { ...b, ...updates } : b),
          updatedAt: Date.now(),
        };
      }),
    }));
  },

  deleteBlock: (pageId, blockId) => {
    set(state => ({
      pages: state.pages.map(p => {
        if (p.id !== pageId) return p;
        const blocks = p.blocks.filter(b => b.id !== blockId);
        if (blocks.length === 0) blocks.push({ id: uid(), type: 'paragraph', content: '' });
        return { ...p, blocks, updatedAt: Date.now() };
      }),
    }));
  },

  toggleSidebar: () => set(state => ({ sidebarOpen: !state.sidebarOpen })),
}));
