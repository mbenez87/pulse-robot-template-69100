import React, { useState, useEffect } from "react";
import { 
  FileText, 
  Image as ImageIcon, 
  Video, 
  File, 
  Folder,
  FileSpreadsheet,
  FileArchive,
  Loader2
} from "lucide-react";
import { Document } from "@/hooks/useDocuments";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface FileThumbnailProps {
  document: Document;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const getFileIcon = (type: string, isFolder?: boolean) => {
  if (isFolder) return Folder;
  if (type.includes('pdf')) return FileText;
  if (type.includes('doc')) return FileText;
  if (type.includes('sheet') || type.includes('excel')) return FileSpreadsheet;
  if (type.startsWith('image/')) return ImageIcon;
  if (type.startsWith('video/')) return Video;
  if (type.includes('zip') || type.includes('rar') || type.includes('archive')) return FileArchive;
  return File;
};

const getFileTypeColor = (type: string, isFolder?: boolean) => {
  if (isFolder) return "text-blue-600 bg-blue-50";
  if (type.includes('pdf')) return "text-red-600 bg-red-50";
  if (type.includes('doc')) return "text-blue-600 bg-blue-50";
  if (type.includes('sheet') || type.includes('excel')) return "text-green-600 bg-green-50";
  if (type.startsWith('image/')) return "text-purple-600 bg-purple-50";
  if (type.startsWith('video/')) return "text-orange-600 bg-orange-50";
  if (type.includes('zip') || type.includes('rar') || type.includes('archive')) return "text-yellow-600 bg-yellow-50";
  return "text-gray-600 bg-gray-50";
};

const sizeClasses = {
  sm: "h-6 w-6",
  md: "h-8 w-8", 
  lg: "h-12 w-12"
};

const containerSizeClasses = {
  sm: "w-8 h-8",
  md: "w-12 h-12",
  lg: "w-16 h-16"
};

export const FileThumbnail = ({ document, size = "md", className }: FileThumbnailProps) => {
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const Icon = getFileIcon(document.file_type, document.is_folder);
  const colorClass = getFileTypeColor(document.file_type, document.is_folder);

  useEffect(() => {
    const loadThumbnail = async () => {
      // Only try to load thumbnails for image and video files
      if (!document.storage_path || document.is_folder) return;
      
      const isImage = document.file_type.startsWith('image/');
      const isVideo = document.file_type.startsWith('video/');
      
      if (!isImage && !isVideo) return;

      setLoading(true);
      setError(false);

      try {
        // Get signed URL for the file
        const { data, error: urlError } = await supabase.storage
          .from('docs')
          .createSignedUrl(document.storage_path, 60 * 60); // 1 hour expiry

        if (urlError) {
          console.error('Error creating signed URL:', urlError);
          setError(true);
          return;
        }

        if (data?.signedUrl) {
          setThumbnailUrl(data.signedUrl);
        }
      } catch (err) {
        console.error('Error loading thumbnail:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    loadThumbnail();
  }, [document.storage_path, document.file_type, document.is_folder]);

  // Show loading state
  if (loading) {
    return (
      <div className={cn(
        "flex items-center justify-center rounded-lg bg-gray-100",
        containerSizeClasses[size],
        className
      )}>
        <Loader2 className={cn("animate-spin text-gray-400", sizeClasses[size])} />
      </div>
    );
  }

  // Show image thumbnail
  if (thumbnailUrl && document.file_type.startsWith('image/') && !error) {
    return (
      <div className={cn(
        "relative rounded-lg overflow-hidden bg-gray-100",
        containerSizeClasses[size],
        className
      )}>
        <img
          src={thumbnailUrl}
          alt={document.file_name}
          className="w-full h-full object-cover"
          onError={() => setError(true)}
        />
      </div>
    );
  }

  // Show video thumbnail (first frame)
  if (thumbnailUrl && document.file_type.startsWith('video/') && !error) {
    return (
      <div className={cn(
        "relative rounded-lg overflow-hidden bg-gray-100",
        containerSizeClasses[size],
        className
      )}>
        <video
          className="w-full h-full object-cover"
          preload="metadata"
          onError={() => setError(true)}
        >
          <source src={thumbnailUrl} type={document.file_type} />
        </video>
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
          <Video className="h-4 w-4 text-white" />
        </div>
      </div>
    );
  }

  // Show default icon for folders and other file types
  return (
    <div className={cn(
      "flex items-center justify-center rounded-lg",
      containerSizeClasses[size],
      colorClass,
      className
    )}>
      <Icon className={sizeClasses[size]} />
    </div>
  );
};