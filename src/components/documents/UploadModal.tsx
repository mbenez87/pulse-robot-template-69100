import React, { useState, useCallback } from "react";
import { 
  Upload, 
  X, 
  FileText, 
  Image, 
  Video, 
  Archive,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { useDocuments } from "@/hooks/useDocuments";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentFolderId?: string;
}

interface UploadFile {
  id: string;
  file: File;
  progress: number;
  status: "uploading" | "complete" | "error";
}

const getFileIcon = (type: string) => {
  if (type.startsWith("image/")) return Image;
  if (type.startsWith("video/")) return Video;
  if (type.includes("zip") || type.includes("rar")) return Archive;
  return FileText;
};

const getFileTypeColor = (type: string) => {
  if (type.startsWith("image/")) return "text-green-600 bg-green-50";
  if (type.startsWith("video/")) return "text-purple-600 bg-purple-50";
  if (type.includes("zip") || type.includes("rar")) return "text-orange-600 bg-orange-50";
  return "text-blue-600 bg-blue-50";
};

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const ACCEPTED_TYPES = [
  '.pdf',
  '.doc', '.docx',
  '.xls', '.xlsx',
  '.jpeg', '.jpg', '.png'
];

const ACCEPTED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpeg',
  'image/jpg',
  'image/png'
];

const UploadModal = ({ isOpen, onClose, currentFolderId }: UploadModalProps) => {
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [overallProgress, setOverallProgress] = useState(0);
  const { uploadDocument } = useDocuments(currentFolderId);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const realUpload = useCallback(async (fileId: string, file: File) => {
    try {
      console.log(`Starting upload for file: ${file.name}`);
      
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setUploadFiles(prev => 
          prev.map(f => 
            f.id === fileId 
              ? { ...f, progress: Math.min(f.progress + Math.random() * 20, 90) }
              : f
          )
        );
      }, 200);

      // Actual upload
      const result = await uploadDocument(file);
      
      clearInterval(progressInterval);
      
      if (result) {
        console.log(`Upload successful for file: ${file.name}`);
        setUploadFiles(prev => 
          prev.map(f => 
            f.id === fileId 
              ? { ...f, progress: 100, status: "complete" }
              : f
          )
        );
      } else {
        console.error(`Upload failed for file: ${file.name}`);
        setUploadFiles(prev => 
          prev.map(f => 
            f.id === fileId 
              ? { ...f, status: "error" }
              : f
          )
        );
      }
    } catch (error) {
      console.error(`Upload error for file: ${file.name}`, error);
      setUploadFiles(prev => 
        prev.map(f => 
          f.id === fileId 
            ? { ...f, status: "error" }
            : f
        )
      );
    }
  }, [uploadDocument]);

  const processFiles = useCallback((files: File[]) => {
    console.log(`Processing ${files.length} files`);
    
    // Filter for allowed file types
    const allowedFiles = files.filter(file => {
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      return ACCEPTED_TYPES.includes(fileExtension) || ACCEPTED_MIME_TYPES.includes(file.type);
    });

    if (allowedFiles.length !== files.length) {
      // Show error for rejected files
      console.warn(`${files.length - allowedFiles.length} files were rejected. Only PDF, DOC/DOCX, XLS/XLSX, and JPEG/PNG files are allowed.`);
    }

    if (allowedFiles.length === 0) {
      console.warn('No valid files to upload');
      return;
    }

    const newUploadFiles: UploadFile[] = allowedFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      progress: 0,
      status: "uploading" as const,
    }));

    console.log(`Adding ${newUploadFiles.length} files to upload queue`);
    setUploadFiles(prev => [...prev, ...newUploadFiles]);

    // Upload files with progress tracking
    newUploadFiles.forEach(uploadFile => {
      console.log(`Starting upload for: ${uploadFile.file.name}`);
      realUpload(uploadFile.id, uploadFile.file);
    });
  }, [realUpload]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    processFiles(files);
  }, [processFiles]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('File input changed');
    if (e.target.files) {
      const files = Array.from(e.target.files);
      console.log(`Selected ${files.length} files:`, files.map(f => f.name));
      processFiles(files);
      // Reset the input value so the same file can be selected again
      e.target.value = '';
    }
  }, [processFiles]);

  const removeFile = (fileId: string) => {
    setUploadFiles(prev => prev.filter(file => file.id !== fileId));
  };

  const handleClose = () => {
    setUploadFiles([]);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white z-50 border border-gray-200 shadow-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-pulse-600" />
            Upload Documents
          </DialogTitle>
          <DialogDescription>
            Upload your documents to your secure workspace. Supported formats: PDF, DOC/DOCX, XLS/XLSX, JPEG/PNG.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Upload Area */}
          <div
            className={cn(
              "border-2 border-dashed rounded-2xl p-8 text-center transition-colors",
              isDragOver 
                ? "border-pulse-500 bg-pulse-50" 
                : "border-gray-300 hover:border-pulse-400"
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Drag and drop files here
            </h3>
            <p className="text-gray-500 mb-4">
              or click to browse your computer
            </p>
            <Button
              variant="outline"
              className="relative overflow-hidden"
            >
              Choose Files
              <input
                type="file"
                multiple
                onChange={handleFileInput}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </Button>
            <p className="text-xs text-gray-400 mt-4">
              Supports: PDF, DOC, DOCX, JPG, PNG, MP4, ZIP (Max 100MB per file)
            </p>
          </div>

          {/* Upload Progress */}
          {uploadFiles.length > 0 && (
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Uploading Files</h4>
              <div className="space-y-3 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3 bg-gray-50">
                {uploadFiles.map((uploadFile) => {
                  const Icon = getFileIcon(uploadFile.file.type);
                  return (
                    <div
                      key={uploadFile.id}
                      className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-lg shadow-sm"
                    >
                      <div className={cn("p-2 rounded-lg", getFileTypeColor(uploadFile.file.type))}>
                        <Icon className="h-4 w-4" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {uploadFile.file.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatFileSize(uploadFile.file.size)}
                        </p>
                        
                        {uploadFile.status === "uploading" && (
                          <div className="mt-2">
                            <Progress value={uploadFile.progress} className="h-2" />
                            <p className="text-xs text-gray-500 mt-1">
                              {Math.round(uploadFile.progress)}% uploaded
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {uploadFile.status === "complete" && (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        )}
                        {uploadFile.status === "error" && (
                          <AlertCircle className="h-5 w-5 text-red-500" />
                        )}
                        <button
                          onClick={() => removeFile(uploadFile.id)}
                          className="p-1 hover:bg-gray-200 rounded text-gray-400 hover:text-gray-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t bg-white sticky bottom-0">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleClose}
              disabled={uploadFiles.some(f => f.status === "uploading")}
              className="button-primary"
            >
              {uploadFiles.some(f => f.status === "uploading") ? "Uploading..." : "Done"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UploadModal;