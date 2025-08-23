import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  ArrowLeft,
  Download,
  Share2,
  Star,
  Trash2,
  FileText,
  Image,
  Video,
  Archive,
  Calendar,
  HardDrive,
  User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { cn } from "@/lib/utils";

// Mock data for documents (same as DocumentGrid)
const mockDocuments = [
  {
    id: 1,
    name: "Project_Proposal_2024.pdf",
    type: "document",
    size: "2.4 MB",
    modified: "2 hours ago",
    created: "March 15, 2024",
    author: "Sarah Johnson",
    thumbnail: null,
    starred: true,
    summary: "This comprehensive project proposal outlines our strategic initiative for Q2 2024, including market analysis and budget projections. The document presents a detailed roadmap for implementation with clear milestones and success metrics.",
  },
  {
    id: 2,
    name: "Design_Assets.zip",
    type: "archive",
    size: "45.2 MB",
    modified: "1 day ago",
    created: "March 14, 2024",
    author: "Mike Chen",
    thumbnail: null,
    starred: false,
    summary: "Complete collection of design assets for the new product interface including logos, icons, and style guides. All assets are organized in folders and include both source files and exported versions for development use.",
  },
  {
    id: 3,
    name: "robot_showcase.jpg",
    type: "image",
    size: "8.1 MB",
    modified: "3 days ago",
    created: "March 12, 2024",
    author: "Alex Rivera",
    thumbnail: "/lovable-uploads/22d31f51-c174-40a7-bd95-00e4ad00eaf3.png",
    starred: false,
    summary: "High-resolution promotional image showcasing our latest robotic platform in an industrial setting. The image captures the advanced design and engineering excellence that defines our product line.",
  },
  {
    id: 4,
    name: "Demo_Video.mp4",
    type: "video",
    size: "156.8 MB",
    modified: "1 week ago",
    created: "March 8, 2024",
    author: "Emma Davis",
    thumbnail: null,
    starred: true,
    summary: "Comprehensive product demonstration video highlighting key features and capabilities of our AI-powered platform. The video includes real-world use cases and testimonials from beta users showcasing practical applications.",
  },
  {
    id: 5,
    name: "Meeting_Notes.docx",
    type: "document",
    size: "1.2 MB",
    modified: "2 weeks ago",
    created: "March 1, 2024",
    author: "David Wilson",
    thumbnail: null,
    starred: false,
    summary: "Detailed notes from the quarterly strategy meeting covering product roadmap and market positioning. Key decisions include timeline adjustments and resource allocation for upcoming product launches.",
  },
  {
    id: 6,
    name: "pulse_interface.png",
    type: "image",
    size: "3.7 MB",
    modified: "3 weeks ago",
    created: "February 25, 2024",
    author: "Lisa Park",
    thumbnail: "/lovable-uploads/af412c03-21e4-4856-82ff-d1a975dc84a9.png",
    starred: false,
    summary: "Screenshot of the new Pulse platform interface showcasing the clean, intuitive design and advanced analytics dashboard. The interface demonstrates our commitment to user experience and data visualization excellence.",
  },
];

const getFileIcon = (type: string) => {
  switch (type) {
    case "document":
      return FileText;
    case "image":
      return Image;
    case "video":
      return Video;
    case "archive":
      return Archive;
    default:
      return FileText;
  }
};

const getFileTypeColor = (type: string) => {
  switch (type) {
    case "document":
      return "text-blue-600 bg-blue-50 border-blue-200";
    case "image":
      return "text-green-600 bg-green-50 border-green-200";
    case "video":
      return "text-purple-600 bg-purple-50 border-purple-200";
    case "archive":
      return "text-orange-600 bg-orange-50 border-orange-200";
    default:
      return "text-gray-600 bg-gray-50 border-gray-200";
  }
};

const DocumentDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const document = mockDocuments.find(doc => doc.id === parseInt(id || "0"));
  
  if (!document) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Document Not Found</h1>
          <Button onClick={() => window.history.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Documents
          </Button>
        </div>
      </div>
    );
  }

  const Icon = getFileIcon(document.type);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-20">
        <div className="section-container">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button 
              variant="outline" 
              onClick={() => window.history.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Documents
            </Button>
            
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-foreground">{document.name}</h1>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button variant="outline" size="sm">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button variant="outline" size="sm">
                <Star className={cn("h-4 w-4 mr-2", document.starred && "fill-yellow-400 text-yellow-400")} />
                {document.starred ? "Starred" : "Star"}
              </Button>
              <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Document Preview */}
            <div className="lg:col-span-2">
              <div className="bg-card rounded-2xl shadow-elegant overflow-hidden">
                <div className="p-6 border-b border-border">
                  <h2 className="text-xl font-semibold text-card-foreground">Document Preview</h2>
                </div>
                
                <div className="aspect-[4/3] bg-muted flex items-center justify-center">
                  {document.thumbnail ? (
                    <img
                      src={document.thumbnail}
                      alt={document.name}
                      className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                    />
                  ) : (
                    <div className="text-center">
                      <div className={cn("p-8 rounded-2xl mx-auto mb-4 inline-block border", getFileTypeColor(document.type))}>
                        <Icon className="h-16 w-16" />
                      </div>
                      <p className="text-muted-foreground">Preview not available for this file type</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        {document.type === "document" && "Click download to view the document"}
                        {document.type === "video" && "Click download to play the video"}
                        {document.type === "archive" && "Click download to extract the archive"}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Document Info & Summary */}
            <div className="space-y-6">
              {/* Document Info */}
              <div className="bg-card rounded-2xl shadow-elegant p-6">
                <h3 className="text-lg font-semibold text-card-foreground mb-4">Document Information</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className={cn("capitalize", getFileTypeColor(document.type))}>
                      {document.type}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-3 text-sm">
                    <HardDrive className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Size:</span>
                    <span className="font-medium">{document.size}</span>
                  </div>
                  
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Created:</span>
                    <span className="font-medium">{document.created}</span>
                  </div>
                  
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Modified:</span>
                    <span className="font-medium">{document.modified}</span>
                  </div>
                  
                  <div className="flex items-center gap-3 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Author:</span>
                    <span className="font-medium">{document.author}</span>
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="bg-card rounded-2xl shadow-elegant p-6">
                <h3 className="text-lg font-semibold text-card-foreground mb-4">AI-Generated Summary</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {document.summary}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default DocumentDetail;