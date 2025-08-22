import React, { useState } from 'react';
import {
  MoreVertical,
  Download,
  Share2,
  Star,
  Trash2,
  FolderOpen,
  Copy,
  Edit3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Document } from '@/hooks/useDocuments';

interface DocumentActionsProps {
  document: Document;
  onDownload: (document: Document) => void;
  onDelete: (documentId: string) => void;
  onOpen?: (document: Document) => void;
  className?: string;
}

const DocumentActions = ({
  document,
  onDownload,
  onDelete,
  onOpen,
  className
}: DocumentActionsProps) => {
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [newName, setNewName] = useState(document.file_name);
  const { toast } = useToast();

  const handleShare = () => {
    setShowShareDialog(true);
  };

  const handleCopyLink = () => {
    const url = window.location.origin + `/shared/${document.id}`;
    navigator.clipboard.writeText(url);
    toast({
      title: "Link copied",
      description: "Share link copied to clipboard"
    });
    setShowShareDialog(false);
  };

  const handleRename = () => {
    setShowRenameDialog(true);
  };

  const confirmRename = () => {
    // This would update the document name in the database
    toast({
      title: "Feature coming soon",
      description: "Document renaming will be available soon"
    });
    setShowRenameDialog(false);
  };

  const confirmDelete = () => {
    if (window.confirm(`Are you sure you want to delete ${document.file_name}?`)) {
      onDelete(document.id);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm" 
            className={className}
            onClick={(e) => e.stopPropagation()}
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {document.is_folder ? (
            <DropdownMenuItem onClick={() => onOpen?.(document)}>
              <FolderOpen className="h-4 w-4 mr-2" />
              Open
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={() => onDownload(document)}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </DropdownMenuItem>
          )}
          
          <DropdownMenuItem onClick={handleShare}>
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={handleRename}>
            <Edit3 className="h-4 w-4 mr-2" />
            Rename
          </DropdownMenuItem>
          
          <DropdownMenuItem>
            <Star className="h-4 w-4 mr-2" />
            Add to favorites
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem 
            className="text-destructive focus:text-destructive"
            onClick={confirmDelete}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Share Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share {document.file_name}</DialogTitle>
            <DialogDescription>
              Create a share link that others can use to access this {document.is_folder ? 'folder' : 'file'}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Share link</Label>
              <div className="flex gap-2">
                <Input
                  value={`${window.location.origin}/shared/${document.id}`}
                  readOnly
                  className="flex-1"
                />
                <Button onClick={handleCopyLink} variant="outline">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename {document.is_folder ? 'folder' : 'file'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && confirmRename()}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowRenameDialog(false)}>
                Cancel
              </Button>
              <Button onClick={confirmRename}>
                Rename
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DocumentActions;