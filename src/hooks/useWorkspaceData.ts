import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { Tables } from '@/integrations/supabase/types';

export type DbWorkspace = Tables<'workspaces'>;
export type DbPage = Tables<'pages'>;
export type DbBlock = Tables<'blocks'>;

export const useWorkspaceData = () => {
  const { user } = useAuth();
  const [workspaces, setWorkspaces] = useState<DbWorkspace[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);
  const [pages, setPages] = useState<DbPage[]>([]);
  const [blocks, setBlocks] = useState<Map<string, DbBlock[]>>(new Map());
  const [activePageId, setActivePageId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load workspaces
  const loadWorkspaces = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('workspace_members')
      .select('workspace_id')
      .eq('user_id', user.id);
    if (!data?.length) { setLoading(false); return; }

    const ids = data.map(d => d.workspace_id);
    const { data: ws } = await supabase.from('workspaces').select('*').in('id', ids);
    setWorkspaces(ws || []);
    if (ws?.length && !activeWorkspaceId) {
      setActiveWorkspaceId(ws[0].id);
    }
    setLoading(false);
  }, [user, activeWorkspaceId]);

  // Load pages for active workspace
  const loadPages = useCallback(async () => {
    if (!activeWorkspaceId) { setPages([]); return; }
    const { data } = await supabase.from('pages').select('*').eq('workspace_id', activeWorkspaceId).order('sort_order');
    setPages(data || []);
    if (data?.length && !activePageId) {
      setActivePageId(data[0].id);
    }
  }, [activeWorkspaceId, activePageId]);

  // Load blocks for active page
  const loadBlocks = useCallback(async (pageId: string) => {
    const { data } = await supabase.from('blocks').select('*').eq('page_id', pageId).order('sort_order');
    setBlocks(prev => new Map(prev).set(pageId, data || []));
  }, []);

  useEffect(() => { loadWorkspaces(); }, [loadWorkspaces]);
  useEffect(() => { loadPages(); }, [loadPages]);
  useEffect(() => {
    if (activePageId) loadBlocks(activePageId);
  }, [activePageId, loadBlocks]);

  // CRUD operations
  const addPage = async (parentId: string | null = null) => {
    if (!activeWorkspaceId || !user) return null;
    const icons = ['📄', '📝', '📋', '📌', '📎', '🗂️', '💡', '⭐', '🎯', '📊'];
    const icon = icons[Math.floor(Math.random() * icons.length)];
    const { data, error } = await supabase.from('pages').insert({
      workspace_id: activeWorkspaceId,
      parent_id: parentId,
      title: '',
      icon,
      created_by: user.id,
      sort_order: pages.length,
    }).select().single();
    if (data) {
      // Add default empty block
      await supabase.from('blocks').insert({ page_id: data.id, type: 'paragraph', content: '', sort_order: 0 });
      await loadPages();
      setActivePageId(data.id);
      await loadBlocks(data.id);
      return data.id;
    }
    return null;
  };

  const deletePage = async (id: string) => {
    await supabase.from('pages').delete().eq('id', id);
    await loadPages();
    if (activePageId === id) {
      const remaining = pages.filter(p => p.id !== id);
      setActivePageId(remaining.length ? remaining[0].id : null);
    }
  };

  const updatePageTitle = async (id: string, title: string) => {
    await supabase.from('pages').update({ title }).eq('id', id);
    setPages(prev => prev.map(p => p.id === id ? { ...p, title } : p));
  };

  const updatePageIcon = async (id: string, icon: string) => {
    await supabase.from('pages').update({ icon }).eq('id', id);
    setPages(prev => prev.map(p => p.id === id ? { ...p, icon } : p));
  };

  const addBlock = async (pageId: string, afterBlockId: string | null, type: string = 'paragraph') => {
    const currentBlocks = blocks.get(pageId) || [];
    const afterIdx = afterBlockId ? currentBlocks.findIndex(b => b.id === afterBlockId) : currentBlocks.length - 1;
    const sortOrder = afterIdx >= 0 ? (currentBlocks[afterIdx]?.sort_order ?? 0) + 1 : 0;

    const { data } = await supabase.from('blocks').insert({
      page_id: pageId,
      type: type as any,
      content: '',
      sort_order: sortOrder,
      ...(type === 'todo' ? { checked: false } : {}),
    }).select().single();

    if (data) {
      await loadBlocks(pageId);
      return data.id;
    }
    return null;
  };

  const updateBlock = async (pageId: string, blockId: string, updates: Partial<DbBlock>) => {
    const { content, type, checked } = updates;
    const updatePayload: any = {};
    if (content !== undefined) updatePayload.content = content;
    if (type !== undefined) updatePayload.type = type;
    if (checked !== undefined) updatePayload.checked = checked;
    
    await supabase.from('blocks').update(updatePayload).eq('id', blockId);
    setBlocks(prev => {
      const newMap = new Map(prev);
      const pageBlocks = (newMap.get(pageId) || []).map(b => b.id === blockId ? { ...b, ...updatePayload } : b);
      newMap.set(pageId, pageBlocks);
      return newMap;
    });
  };

  const deleteBlock = async (pageId: string, blockId: string) => {
    await supabase.from('blocks').delete().eq('id', blockId);
    await loadBlocks(pageId);
  };

  const addSubPageBlock = async (pageId: string, afterBlockId: string | null) => {
    if (!activeWorkspaceId || !user) return null;
    const icons = ['📄', '📝', '📋', '📌'];
    const icon = icons[Math.floor(Math.random() * icons.length)];
    
    // Create subpage
    const { data: subPage } = await supabase.from('pages').insert({
      workspace_id: activeWorkspaceId,
      parent_id: pageId,
      title: '',
      icon,
      created_by: user.id,
      sort_order: pages.length,
    }).select().single();

    if (!subPage) return null;

    // Add empty block to subpage
    await supabase.from('blocks').insert({ page_id: subPage.id, type: 'paragraph', content: '', sort_order: 0 });

    // Add page-type block to current page
    const currentBlocks = blocks.get(pageId) || [];
    const afterIdx = afterBlockId ? currentBlocks.findIndex(b => b.id === afterBlockId) : currentBlocks.length - 1;
    const sortOrder = afterIdx >= 0 ? (currentBlocks[afterIdx]?.sort_order ?? 0) + 1 : 0;

    const { data: blockData } = await supabase.from('blocks').insert({
      page_id: pageId,
      type: 'page',
      content: '',
      linked_page_id: subPage.id,
      sort_order: sortOrder,
    }).select().single();

    await loadPages();
    await loadBlocks(pageId);
    setActivePageId(subPage.id);
    await loadBlocks(subPage.id);
    return blockData?.id || null;
  };

  const getPageBreadcrumbs = (pageId: string): DbPage[] => {
    const crumbs: DbPage[] = [];
    let current = pages.find(p => p.id === pageId);
    while (current) {
      crumbs.unshift(current);
      current = current.parent_id ? pages.find(p => p.id === current!.parent_id) : undefined;
    }
    return crumbs;
  };

  const getChildPages = (parentId: string | null) => {
    return pages.filter(p => p.parent_id === parentId);
  };

  return {
    workspaces,
    activeWorkspaceId,
    setActiveWorkspaceId,
    pages,
    blocks,
    activePageId,
    setActivePageId,
    loading,
    addPage,
    deletePage,
    updatePageTitle,
    updatePageIcon,
    addBlock,
    updateBlock,
    deleteBlock,
    addSubPageBlock,
    getPageBreadcrumbs,
    getChildPages,
    loadWorkspaces,
    loadPages,
  };
};
