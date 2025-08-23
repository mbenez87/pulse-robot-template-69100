import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { 
  ArrowLeft, 
  Download, 
  Printer, 
  ZoomIn, 
  ZoomOut, 
  ChevronLeft, 
  ChevronRight,
  ExternalLink,
  Play,
  Pause,
  Maximize
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";

interface Document {
  id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  storage_path: string;
  ai_summary?: string;
}

export default function Viewer() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [document, setDocument] = useState<Document | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [zoom, setZoom] = useState(100);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  useEffect(() => {
    const fetchDocument = async () => {
      if (!id) return;
      
      try {
        const { data, error } = await supabase
          .from("documents")
          .select("*")
          .eq("id", id)
          .single();

        if (error) throw error;
        
        setDocument(data);
        
        // Get signed URL for the file
        if (data.storage_path) {
          const { data: signedUrl } = await supabase.storage
            .from("docs")
            .createSignedUrl(data.storage_path, 3600); // 1 hour

          if (signedUrl?.signedUrl) {
            setFileUrl(signedUrl.signedUrl);
          }
        }
      } catch (error) {
        console.error("Error fetching document:", error);
        toast({
          title: "Error",
          description: "Failed to load document",
          variant: "destructive",
        });
        navigate("/documents");
      } finally {
        setLoading(false);
      }
    };

    fetchDocument();
  }, [id, navigate, toast]);

  const handleDownload = async () => {
    if (!fileUrl || !document) return;
    
    try {
      const response = await fetch(fileUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = document.file_name;
      window.document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      window.document.body.removeChild(a);
      
      toast({
        title: "Download started",
        description: `Downloading ${document.file_name}`,
      });
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Failed to download file",
        variant: "destructive",
      });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 25, 300));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 25, 25));
  };

  const resetZoom = () => {
    setZoom(100);
  };

  const openExternal = () => {
    if (fileUrl) {
      window.open(fileUrl, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading document...</p>
        </div>
      </div>
    );
  }

  if (!document || !fileUrl) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4">Document not found</p>
          <Button onClick={() => navigate("/documents")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Documents
          </Button>
        </div>
      </div>
    );
  }

  const isImage = document.file_type?.startsWith("image/");
  const isVideo = document.file_type?.startsWith("video/");
  const isPDF = document.file_type === "application/pdf";
  const isOfficeDoc = document.file_type?.includes("word") || 
                     document.file_type?.includes("excel") || 
                     document.file_type?.includes("powerpoint") ||
                     document.file_type?.includes("sheet") ||
                     document.file_type?.includes("document");

  return (
    <div className="min-h-screen bg-background">
      {/* Toolbar */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate("/documents")}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <h1 className="font-semibold truncate max-w-md" title={document.file_name}>
              {document.file_name}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            {/* Zoom controls for images and PDFs */}
            {(isImage || isPDF) && (
              <>
                <Button variant="ghost" size="sm" onClick={handleZoomOut}>
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground min-w-[60px] text-center">
                  {zoom}%
                </span>
                <Button variant="ghost" size="sm" onClick={handleZoomIn}>
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={resetZoom}>
                  Reset
                </Button>
              </>
            )}

            {/* Page controls for PDFs */}
            {isPDF && (
              <>
                <div className="border-l mx-2 h-6"></div>
                <Button variant="ghost" size="sm" onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground">
                  {currentPage} / {totalPages}
                </span>
                <Button variant="ghost" size="sm" onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </>
            )}

            <div className="border-l mx-2 h-6"></div>
            
            <Button variant="ghost" size="sm" onClick={openExternal}>
              <ExternalLink className="mr-2 h-4 w-4" />
              Open
            </Button>
            <Button variant="ghost" size="sm" onClick={handleDownload}>
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
            {(isImage || isPDF) && (
              <Button variant="ghost" size="sm" onClick={handlePrint}>
                <Printer className="mr-2 h-4 w-4" />
                Print
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Viewer Content */}
      <div className="flex-1 overflow-auto">
        {isImage && (
          <div className="flex items-center justify-center min-h-[calc(100vh-80px)] p-4">
            <img 
              src={fileUrl} 
              alt={document.file_name}
              style={{ transform: `scale(${zoom / 100})` }}
              className="max-w-full max-h-full object-contain transition-transform duration-200"
              draggable={false}
            />
          </div>
        )}

        {isVideo && (
          <div className="flex items-center justify-center min-h-[calc(100vh-80px)] p-4">
            <video 
              src={fileUrl} 
              controls
              className="max-w-full max-h-full"
              onPlay={() => setIsVideoPlaying(true)}
              onPause={() => setIsVideoPlaying(false)}
            >
              Your browser does not support the video tag.
            </video>
          </div>
        )}

        {isPDF && (
          <div className="w-full h-[calc(100vh-80px)]">
            <iframe 
              src={fileUrl}
              className="w-full h-full border-0"
              style={{ transform: `scale(${zoom / 100})` }}
              title={document.file_name}
            />
          </div>
        )}

        {isOfficeDoc && (
          <div className="flex items-center justify-center min-h-[calc(100vh-80px)] p-8">
            <div className="text-center max-w-md">
              <div className="mb-6">
                <div className="mx-auto h-16 w-16 bg-muted rounded-lg flex items-center justify-center mb-4">
                  <ExternalLink className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold mb-2">Preview not available</h3>
                <p className="text-muted-foreground mb-6">
                  This file type requires an external application to view. You can download or open it in a new tab.
                </p>
              </div>
              
              <div className="space-y-3">
                <Button onClick={openExternal} className="w-full">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open in Browser
                </Button>
                <Button variant="outline" onClick={handleDownload} className="w-full">
                  <Download className="mr-2 h-4 w-4" />
                  Download File
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}