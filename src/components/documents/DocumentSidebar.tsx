import React from "react";
import { 
  FolderOpen, 
  FileText, 
  Image, 
  Video, 
  Archive, 
  Star,
  Clock,
  Trash2
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DocumentSidebarProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

const categories = [
  { id: "all", label: "All Documents", icon: FolderOpen, count: 127 },
  { id: "documents", label: "Documents", icon: FileText, count: 45 },
  { id: "images", label: "Images", icon: Image, count: 32 },
  { id: "videos", label: "Videos", icon: Video, count: 18 },
  { id: "archives", label: "Archives", icon: Archive, count: 12 },
];

const quickAccess = [
  { id: "starred", label: "Starred", icon: Star, count: 8 },
  { id: "recent", label: "Recent", icon: Clock, count: 15 },
  { id: "trash", label: "Trash", icon: Trash2, count: 3 },
];

const DocumentSidebar = ({ selectedCategory, onCategoryChange }: DocumentSidebarProps) => {
  return (
    <div className="space-y-6">
      {/* Categories */}
      <div className="bg-white rounded-2xl p-6 shadow-elegant">
        <h3 className="font-semibold text-gray-900 mb-4">Categories</h3>
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
                    ? "bg-pulse-50 text-pulse-600 border border-pulse-200"
                    : "hover:bg-gray-50 text-gray-700"
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-4 w-4" />
                  <span className="font-medium">{category.label}</span>
                </div>
                <span className="text-sm text-gray-500">{category.count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Quick Access */}
      <div className="bg-white rounded-2xl p-6 shadow-elegant">
        <h3 className="font-semibold text-gray-900 mb-4">Quick Access</h3>
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
                    ? "bg-pulse-50 text-pulse-600 border border-pulse-200"
                    : "hover:bg-gray-50 text-gray-700"
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-4 w-4" />
                  <span className="font-medium">{item.label}</span>
                </div>
                <span className="text-sm text-gray-500">{item.count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Storage Usage */}
      <div className="bg-white rounded-2xl p-6 shadow-elegant">
        <h3 className="font-semibold text-gray-900 mb-4">Storage Usage</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Used</span>
            <span className="font-medium">2.4 GB / 5 GB</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-pulse-500 h-2 rounded-full transition-all duration-300" 
              style={{ width: "48%" }}
            />
          </div>
          <p className="text-xs text-gray-500">
            You have 2.6 GB of free space remaining
          </p>
        </div>
      </div>
    </div>
  );
};

export default DocumentSidebar;