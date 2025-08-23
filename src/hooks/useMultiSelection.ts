import { useState, useCallback } from 'react';

export interface UseMultiSelectionProps {
  items: Array<{ id: string }>;
}

export function useMultiSelection({ items }: UseMultiSelectionProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [lastIndex, setLastIndex] = useState<number | null>(null);

  const handleRowClick = useCallback((e: React.MouseEvent, id: string, index: number) => {
    if (e.shiftKey && lastIndex !== null) {
      // Range selection - matches your exact logic
      const [a, b] = [lastIndex, index].sort((x, y) => x - y);
      const range = items.slice(a, b + 1).map(item => item.id);
      const union = Array.from(new Set([...selectedIds, ...range]));
      setSelectedIds(union);
    } else if (e.metaKey || e.ctrlKey) {
      // Toggle selection - matches your exact logic
      setSelectedIds(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
      setLastIndex(index);
    } else {
      // Single selection - matches your exact logic
      setSelectedIds([id]);
      setLastIndex(index);
    }
  }, [items, selectedIds, lastIndex]);

  const selectAll = useCallback(() => {
    setSelectedIds(items.map(item => item.id));
  }, [items]);

  const clearSelection = useCallback(() => {
    setSelectedIds([]);
    setLastIndex(null);
  }, []);

  const isSelected = useCallback((id: string) => {
    return selectedIds.includes(id);
  }, [selectedIds]);

  const toggleSelection = useCallback((id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) 
        ? prev.filter(selectedId => selectedId !== id)
        : [...prev, id]
    );
  }, []);

  return {
    selectedIds,
    lastIndex,
    handleRowClick,
    selectAll,
    clearSelection,
    isSelected,
    toggleSelection,
    selectedCount: selectedIds.length,
    isAllSelected: selectedIds.length === items.length && items.length > 0,
  };
}