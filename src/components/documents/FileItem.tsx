import React, { useState, useRef } from "react";
import { 
  MoreHorizontal,
  Edit2,
  Copy,
  Trash2,
  Download,
  Share2
} from "lucide-react";
import { Document } from "@/hooks/useDocuments";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { FileThumbnail } from "./FileThumbnail";

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

interface FileItemProps {
  document: Document;
  viewMode: 'grid' | 'list';
  isSelected: boolean;
  isDragOver: boolean;
  onSelect: (id: string, ctrlKey: boolean, index?: number) => void;
  onOpen: (document: Document) => void;
  onRename: (id: string, newName: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onDownload: (document: Document) => void;
  onShare: (document: Document) => void;
  onDragStart: (e: React.DragEvent, document: Document) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragEnter: (e: React.DragEvent, targetDocument: Document) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, targetDocument: Document) => void;
  index?: number;
}

export const FileItem = ({
  document,
  viewMode,
  isSelected,
  isDragOver,
  onSelect,
  onOpen,
  onRename,
  onDuplicate,
  onDelete,
  onDownload,
  onShare,
  onDragStart,
  onDragOver,
  onDragEnter,
  onDragLeave,
  onDrop,
  index
}: FileItemProps) => {
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(document.title);
  const inputRef = useRef<HTMLInputElement>(null);


  const handleRename = () => {
    if (newName.trim() && newName !== document.title) {
      onRename(document.id, newName.trim());
    }
    setIsRenaming(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRename();
    } else if (e.key === 'Escape') {
      setNewName(document.title);
      setIsRenaming(false);
    }
  };

  const handleDoubleClick = () => {
    if (document.is_folder) {
      onOpen(document);
    } else {
      // For files, navigate to full-screen viewer
      window.location.href = `/viewer/${document.id}`;
    }
  };

  if (viewMode === 'list') {
    return (
      <tr
        className={cn(
          "group cursor-pointer transition-colors",
          isSelected ? "bg-primary/10 border-l-4 border-l-primary" : "hover:bg-muted",
          isDragOver && "bg-primary/20 border-primary/30"
        )}
        draggable
        onDragStart={(e) => onDragStart(e, document)}
        onDragOver={document.is_folder ? onDragOver : undefined}
        onDragEnter={document.is_folder ? (e) => onDragEnter(e, document) : undefined}
        onDragLeave={document.is_folder ? onDragLeave : undefined}
        onDrop={document.is_folder ? (e) => onDrop(e, document) : undefined}
        onClick={(e) => {
          if (index !== undefined) {
            onSelect(document.id, e.ctrlKey || e.metaKey, index);
          }
        }}
        onDoubleClick={handleDoubleClick}
      >
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onSelect(document.id, false)}
              className="h-4 w-4 text-pulse-600 focus:ring-pulse-500 border-gray-300 rounded mr-3"
              onClick={(e) => e.stopPropagation()}
            />
            <FileThumbnail 
              document={document} 
              size="sm" 
              className="mr-3" 
            />
            {isRenaming ? (
              <Input
                ref={inputRef}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onBlur={handleRename}
                onKeyDown={handleKeyDown}
                className="w-auto min-w-0"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span className="text-sm font-medium text-gray-900 truncate">
                {document.title}
              </span>
            )}
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          {document.is_folder ? 'Folder' : formatFileSize(document.size_bytes)}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          {new Date(document.updated_at).toLocaleDateString()}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onOpen(document)}>
            {document.is_folder ? 'Open' : 'Details'}
          </DropdownMenuItem>
          {!document.is_folder && (
            <DropdownMenuItem onClick={() => window.location.href = `/viewer/${document.id}`}>
              Preview
            </DropdownMenuItem>
          )}
              {!document.is_folder && (
                <DropdownMenuItem onClick={() => onDownload(document)}>
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => setIsRenaming(true)}>
                <Edit2 className="mr-2 h-4 w-4" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDuplicate(document.id)}>
                <Copy className="mr-2 h-4 w-4" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onShare(document)}>
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => onDelete(document.id)}
                className="text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </td>
      </tr>
    );
  }

  return (
    <div
      className={cn(
        "group relative p-4 rounded-lg border transition-all cursor-pointer",
        "hover:shadow-md hover:border-primary/30",
        isSelected ? "bg-primary/10 border-primary/30 shadow-sm" : "hover:bg-muted/50",
        isDragOver && "bg-primary/20 border-primary/40 shadow-lg"
      )}
      draggable
      onDragStart={(e) => onDragStart(e, document)}
      onDragOver={document.is_folder ? onDragOver : undefined}
      onDragEnter={document.is_folder ? (e) => onDragEnter(e, document) : undefined}
      onDragLeave={document.is_folder ? onDragLeave : undefined}
      onDrop={document.is_folder ? (e) => onDrop(e, document) : undefined}
      onClick={(e) => {
        if (index !== undefined) {
          onSelect(document.id, e.ctrlKey || e.metaKey, index);
        }
      }}
      onDoubleClick={handleDoubleClick}
    >
      <input
        type="checkbox"
        checked={isSelected}
        onChange={() => onSelect(document.id, false)}
        className="absolute top-2 left-2 h-4 w-4 text-pulse-600 focus:ring-pulse-500 border-gray-300 rounded opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => e.stopPropagation()}
      />
      
      <div className="flex flex-col items-center space-y-3">
        <FileThumbnail 
          document={document} 
          size="lg" 
        />
        
        {isRenaming ? (
          <Input
            ref={inputRef}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onBlur={handleRename}
            onKeyDown={handleKeyDown}
            className="text-center text-sm"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <div className="text-center">
            <h3 className="font-medium text-sm text-gray-900 truncate max-w-[120px]" title={document.title}>
              {document.title}
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              {document.is_folder ? 'Folder' : formatFileSize(document.size_bytes)}
            </p>
          </div>
        )}
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onOpen(document)}>
            {document.is_folder ? 'Open' : 'Details'}
          </DropdownMenuItem>
          {!document.is_folder && (
            <DropdownMenuItem onClick={() => window.location.href = `/viewer/${document.id}`}>
              Preview
            </DropdownMenuItem>
          )}
          {!document.is_folder && (
            <DropdownMenuItem onClick={() => onDownload(document)}>
              <Download className="mr-2 h-4 w-4" />
              Download
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={() => setIsRenaming(true)}>
            <Edit2 className="mr-2 h-4 w-4" />
            Rename
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onDuplicate(document.id)}>
            <Copy className="mr-2 h-4 w-4" />
            Duplicate
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onShare(document)}>
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={() => onDelete(document.id)}
            className="text-red-600"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};