import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FolderNavigationProps {
  path: Array<{ id: string; name: string }>;
  onNavigate: (folderId?: string) => void;
}

const FolderNavigation = ({ path, onNavigate }: FolderNavigationProps) => {
  return (
    <div className="flex items-center gap-1 text-sm text-muted-foreground mb-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onNavigate()}
        className="text-muted-foreground hover:text-foreground"
      >
        <Home className="h-4 w-4" />
        <span className="ml-1">Home</span>
      </Button>
      
      {path.map((folder, index) => (
        <React.Fragment key={folder.id}>
          <ChevronRight className="h-4 w-4" />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate(folder.id)}
            className={`text-muted-foreground hover:text-foreground ${
              index === path.length - 1 ? 'font-medium text-foreground' : ''
            }`}
          >
            {folder.name}
          </Button>
        </React.Fragment>
      ))}
    </div>
  );
};

export default FolderNavigation;