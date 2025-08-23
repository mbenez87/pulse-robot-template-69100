import React from "react";
import { 
  Trash2, 
  Download, 
  Copy, 
  FolderPlus,
  X 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BulkActionsProps {
  selectedCount: number;
  onDownload: () => void;
  onDuplicate: () => void;
  onMove: () => void;
  onDelete: () => void;
  onClearSelection: () => void;
}

export const BulkActions = ({
  selectedCount,
  onDownload,
  onDuplicate,
  onMove,
  onDelete,
  onClearSelection
}: BulkActionsProps) => {
  if (selectedCount === 0) return null;

  return (
    <div className={cn(
      "fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50",
      "bg-white rounded-lg shadow-lg border border-gray-200 p-4",
      "flex items-center gap-3 transition-all duration-200"
    )}>
      <span className="text-sm font-medium text-gray-700">
        {selectedCount} item{selectedCount > 1 ? 's' : ''} selected
      </span>
      
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onDownload}
          className="gap-1"
        >
          <Download className="h-4 w-4" />
          Download
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={onDuplicate}
          className="gap-1"
        >
          <Copy className="h-4 w-4" />
          Duplicate
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={onMove}
          className="gap-1"
        >
          <FolderPlus className="h-4 w-4" />
          Move
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={onDelete}
          className="gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <Trash2 className="h-4 w-4" />
          Delete
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearSelection}
          className="gap-1"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};