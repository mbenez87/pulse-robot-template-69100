import React, { useEffect, useState } from "react";
import { 
  FolderOpen, 
  FileText, 
  Image, 
  Video, 
  Archive, 
  Star,
  Clock,
  Trash2,
  Folder
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface DocumentSidebarProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

interface CategoryCount {
  category: string;
  count: number;
}

const categories = [
  { id: "all", label: "All Files", icon: FolderOpen },
  { id: "images", label: "Images", icon: Image },
  { id: "videos", label: "Videos", icon: Video },
  { id: "pdfs", label: "PDFs", icon: FileText },
  { id: "documents", label: "Documents", icon: FileText },
  { id: "other", label: "Other", icon: Archive },
];

const quickAccess = [
  { id: "starred", label: "Starred", icon: Star, count: 0 },
  { id: "recent", label: "Recent", icon: Clock, count: 0 },
  { id: "trash", label: "Trash", icon: Trash2, count: 0 },
];

const DocumentSidebar = ({ selectedCategory, onCategoryChange }: DocumentSidebarProps) => {
  const { user } = useAuth();
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const fetchCounts = async () => {
      if (!user) return;
      
      try {
        const { data: counts, error } = await supabase.rpc('counts_by_category', { 
          p_owner: user.id 
        });
        
        if (error) throw error;
        
        // Convert array to object for easy lookup
        const countsMap = counts?.reduce((acc: Record<string, number>, item: CategoryCount) => {
          acc[item.category] = item.count;
          return acc;
        }, {}) || {};
        
        setCategoryCounts(countsMap);
      } catch (error) {
        console.error('Error fetching category counts:', error);
      }
    };

    fetchCounts();
    
    // Set up real-time subscription for document changes
    const channel = supabase
      .channel('documents-counts')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'documents',
          filter: `user_id=eq.${user?.id}`
        },
        () => {
          fetchCounts(); // Refresh counts when documents change
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const getCount = (categoryId: string) => {
    return categoryCounts[categoryId] || 0;
  };
  return (
    <div className="space-y-6">
      {/* Categories */}
      <div className="bg-card rounded-lg border p-6">
        <h3 className="font-semibold text-foreground mb-4">Categories</h3>
        <div className="space-y-2">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <button
                key={category.id}
                onClick={() => onCategoryChange(category.id)}
                className={cn(
                  "w-full flex items-center justify-between p-3 rounded-lg text-left transition-colors",
                  selectedCategory === category.id
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "hover:bg-muted text-muted-foreground"
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-4 w-4" />
                  <span className="font-medium">{category.label}</span>
                </div>
                <span className="text-sm text-muted-foreground">{getCount(category.id)}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Quick Access */}
      <div className="bg-card rounded-lg border p-6">
        <h3 className="font-semibold text-foreground mb-4">Quick Access</h3>
        <div className="space-y-2">
          {quickAccess.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => onCategoryChange(item.id)}
                className={cn(
                  "w-full flex items-center justify-between p-3 rounded-lg text-left transition-colors",
                  selectedCategory === item.id
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "hover:bg-muted text-muted-foreground"
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-4 w-4" />
                  <span className="font-medium">{item.label}</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {item.id === 'recent' ? getCount('all') : 0}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Storage Usage */}
      <div className="bg-card rounded-lg border p-6">
        <h3 className="font-semibold text-foreground mb-4">Storage Usage</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Used</span>
            <span className="font-medium text-foreground">0 B / 5 GB</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300" 
              style={{ width: "0%" }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            You have 5 GB of free space available
          </p>
        </div>
      </div>
    </div>
  );
};

export default DocumentSidebar;