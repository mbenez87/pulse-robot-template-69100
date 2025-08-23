import { useState, useCallback } from 'react';

export interface UseMultiSelectionProps {
  items: Array<{ id: string }>;
}

export function useMultiSelection({ items }: UseMultiSelectionProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [lastIndex, setLastIndex] = useState<number | null>(null);

  const handleRowClick = useCallback((e: React.MouseEvent, id: string, index: number) => {
    if (e.shiftKey && lastIndex !== null) {
      // Range selection
      const [start, end] = [lastIndex, index].sort((a, b) => a - b);
      const rangeIds = items.slice(start, end + 1).map(item => item.id);
      const union = Array.from(new Set([...selectedIds, ...rangeIds]));
      setSelectedIds(union);
    } else if (e.metaKey || e.ctrlKey) {
      // Toggle selection
      setSelectedIds(prev => 
        prev.includes(id) 
          ? prev.filter(selectedId => selectedId !== id)
          : [...prev, id]
      );
      setLastIndex(index);
    } else {
      // Single selection
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