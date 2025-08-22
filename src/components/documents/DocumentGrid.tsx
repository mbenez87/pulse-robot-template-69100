import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  FileText, 
  Image, 
  Video, 
  Archive, 
  MoreVertical,
  Download,
  Share2,
  Star,
  Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface DocumentGridProps {
  searchQuery: string;
  selectedCategory: string;
  viewMode: "grid" | "list";
}

// Mock data for documents
const mockDocuments = [
  {
    id: 1,
    name: "Project_Proposal_2024.pdf",
    type: "document",
    size: "2.4 MB",
    modified: "2 hours ago",
    thumbnail: null,
    starred: true,
  },
  {
    id: 2,
    name: "Design_Assets.zip",
    type: "archive",
    size: "45.2 MB",
    modified: "1 day ago",
    thumbnail: null,
    starred: false,
  },
  {
    id: 3,
    name: "robot_showcase.jpg",
    type: "image",
    size: "8.1 MB",
    modified: "3 days ago",
    thumbnail: "/lovable-uploads/22d31f51-c174-40a7-bd95-00e4ad00eaf3.png",
    starred: false,
  },
  {
    id: 4,
    name: "Demo_Video.mp4",
    type: "video",
    size: "156.8 MB",
    modified: "1 week ago",
    thumbnail: null,
    starred: true,
  },
  {
    id: 5,
    name: "Meeting_Notes.docx",
    type: "document",
    size: "1.2 MB",
    modified: "2 weeks ago",
    thumbnail: null,
    starred: false,
  },
  {
    id: 6,
    name: "pulse_interface.png",
    type: "image",
    size: "3.7 MB",
    modified: "3 weeks ago",
    thumbnail: "/lovable-uploads/af412c03-21e4-4856-82ff-d1a975dc84a9.png",
    starred: false,
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
      return "text-blue-600 bg-blue-50";
    case "image":
      return "text-green-600 bg-green-50";
    case "video":
      return "text-purple-600 bg-purple-50";
    case "archive":
      return "text-orange-600 bg-orange-50";
    default:
      return "text-gray-600 bg-gray-50";
  }
};

const DocumentGrid = ({ searchQuery, selectedCategory, viewMode }: DocumentGridProps) => {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState(mockDocuments);

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || 
      (selectedCategory === "documents" && doc.type === "document") ||
      (selectedCategory === "images" && doc.type === "image") ||
      (selectedCategory === "videos" && doc.type === "video") ||
      (selectedCategory === "archives" && doc.type === "archive") ||
      (selectedCategory === "starred" && doc.starred);
    
    return matchesSearch && matchesCategory;
  });

  const toggleStar = (id: number) => {
    setDocuments(docs => 
      docs.map(doc => 
        doc.id === id ? { ...doc, starred: !doc.starred } : doc
      )
    );
  };

  if (viewMode === "list") {
    return (
      <div className="bg-white rounded-2xl shadow-elegant overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-4 px-6 font-medium text-gray-900">Name</th>
                <th className="text-left py-4 px-6 font-medium text-gray-900">Type</th>
                <th className="text-left py-4 px-6 font-medium text-gray-900">Size</th>
                <th className="text-left py-4 px-6 font-medium text-gray-900">Modified</th>
                <th className="text-left py-4 px-6 font-medium text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredDocuments.map((doc) => {
                const Icon = getFileIcon(doc.type);
                return (
                  <tr key={doc.id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => navigate(`/documents/${doc.id}`)}>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className={cn("p-2 rounded-lg", getFileTypeColor(doc.type))}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 truncate">{doc.name}</p>
                        </div>
                        {doc.starred && (
                          <Star className="h-4 w-4 text-yellow-400 fill-current" />
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-gray-600 capitalize">{doc.type}</td>
                    <td className="py-4 px-6 text-gray-600">{doc.size}</td>
                    <td className="py-4 px-6 text-gray-600">{doc.modified}</td>
                    <td className="py-4 px-6">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Share2 className="h-4 w-4 mr-2" />
                            Share
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toggleStar(doc.id)}>
                            <Star className="h-4 w-4 mr-2" />
                            {doc.starred ? "Unstar" : "Star"}
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {filteredDocuments.map((doc) => {
        const Icon = getFileIcon(doc.type);
        return (
          <div
            key={doc.id}
            className="bg-white rounded-2xl shadow-elegant hover:shadow-elegant-hover transition-all duration-300 hover:-translate-y-1 cursor-pointer group"
            onClick={() => navigate(`/documents/${doc.id}`)}
          >
            {/* Thumbnail or Icon */}
            <div className="relative h-48 bg-gray-50 rounded-t-2xl overflow-hidden">
              {doc.thumbnail ? (
                <img
                  src={doc.thumbnail}
                  alt={doc.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className={cn("p-4 rounded-2xl", getFileTypeColor(doc.type))}>
                    <Icon className="h-12 w-12" />
                  </div>
                </div>
              )}
              
              {/* Star Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleStar(doc.id);
                }}
                className="absolute top-3 right-3 p-2 bg-white/80 backdrop-blur-sm rounded-full hover:bg-white transition-colors"
              >
                <Star 
                  className={cn(
                    "h-4 w-4",
                    doc.starred ? "text-yellow-400 fill-current" : "text-gray-400"
                  )} 
                />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-medium text-gray-900 truncate flex-1 mr-2">
                  {doc.name}
                </h3>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Share2 className="h-4 w-4 mr-2" />
                      Share
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => toggleStar(doc.id)}>
                      <Star className="h-4 w-4 mr-2" />
                      {doc.starred ? "Unstar" : "Star"}
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span className="capitalize">{doc.type}</span>
                <span>{doc.size}</span>
              </div>
              
              <p className="text-sm text-gray-500 mt-2">{doc.modified}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default DocumentGrid;