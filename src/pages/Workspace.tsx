import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  Search, Filter, Grid, List, Upload, FolderPlus, 
  MoreHorizontal, Eye, Download, Share, FileText,
  Calendar, Tag, MapPin, ChevronRight
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

interface Document {
  id: string;
  title: string;
  file_type: string;
  file_size: number;
  created_at: string;
  tags?: string[];
  room_id?: string;
  preview_url?: string;
}

export default function Workspace() {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  // Mock documents data
  const documents: Document[] = [
    {
      id: '1',
      title: 'Financial Report Q4 2024',
      file_type: 'application/pdf',
      file_size: 2500000,
      created_at: '2024-01-15T10:30:00Z',
      tags: ['finance', 'quarterly'],
      room_id: 'general'
    },
    {
      id: '2',
      title: 'Marketing Strategy Presentation',
      file_type: 'application/vnd.ms-powerpoint',
      file_size: 5200000,
      created_at: '2024-01-12T14:15:00Z',
      tags: ['marketing', 'strategy'],
      room_id: 'marketing'
    },
    {
      id: '3',
      title: 'Product Requirements Document',
      file_type: 'application/msword',
      file_size: 850000,
      created_at: '2024-01-10T09:45:00Z',
      tags: ['product', 'requirements'],
      room_id: 'product'
    }
  ];

  const handleDocumentSelect = (docId: string) => {
    setSelectedDocs(prev => {
      if (prev.includes(docId)) {
        return prev.filter(id => id !== docId);
      } else {
        return [...prev, docId];
      }
    });
  };

  const handleAskInARIA = () => {
    const params = new URLSearchParams();
    if (selectedDocs.length > 0) {
      params.set('doc_ids', selectedDocs.join(','));
    }
    window.location.href = `/aria?${params.toString()}`;
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="flex h-screen">
        {/* Left Sidebar - Filters */}
        <div className="w-64 border-r bg-card p-4">
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-sm text-muted-foreground mb-3">TYPE</h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox id="pdf" />
                  <label htmlFor="pdf" className="text-sm">PDFs</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="docs" />
                  <label htmlFor="docs" className="text-sm">Documents</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="presentations" />
                  <label htmlFor="presentations" className="text-sm">Presentations</label>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold text-sm text-muted-foreground mb-3">ROOM</h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox id="general" />
                  <label htmlFor="general" className="text-sm">General</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="marketing" />
                  <label htmlFor="marketing" className="text-sm">Marketing</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="product" />
                  <label htmlFor="product" className="text-sm">Product</label>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold text-sm text-muted-foreground mb-3">DATE</h3>
              <Select>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This week</SelectItem>
                  <SelectItem value="month">This month</SelectItem>
                  <SelectItem value="year">This year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="border-b p-4">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold">Workspace</h1>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
                </Button>
                <Button variant="outline" size="sm">
                  <FolderPlus className="h-4 w-4 mr-2" />
                  New Folder
                </Button>
              </div>
            </div>

            {/* Search and Controls */}
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search documents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
              <div className="flex border rounded-lg">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="rounded-r-none"
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="rounded-l-none"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Active Filters */}
            {activeFilters.length > 0 && (
              <div className="flex items-center gap-2 mt-4">
                <span className="text-sm text-muted-foreground">Active filters:</span>
                {activeFilters.map((filter) => (
                  <Badge key={filter} variant="secondary" className="text-xs">
                    {filter}
                  </Badge>
                ))}
              </div>
            )}

            {/* Bulk Actions */}
            {selectedDocs.length > 0 && (
              <div className="flex items-center gap-2 mt-4 p-3 bg-muted rounded-lg">
                <span className="text-sm">{selectedDocs.length} selected</span>
                <Separator orientation="vertical" className="h-4" />
                <Button variant="outline" size="sm" onClick={handleAskInARIA}>
                  Ask in ARIA
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button variant="outline" size="sm">
                  <Share className="h-4 w-4 mr-2" />
                  Share
                </Button>
              </div>
            )}
          </div>

          <div className="flex-1 flex">
            {/* Document Grid/List */}
            <div className="flex-1 p-4">
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {documents.map((doc) => (
                    <Card
                      key={doc.id}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        selectedDocs.includes(doc.id) ? 'ring-2 ring-primary' : ''
                      }`}
                      onClick={() => setSelectedDoc(doc)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <FileText className="h-8 w-8 text-muted-foreground" />
                          <div className="flex items-center gap-2">
                            <Checkbox
                              checked={selectedDocs.includes(doc.id)}
                              onCheckedChange={() => handleDocumentSelect(doc.id)}
                              onClick={(e) => e.stopPropagation()}
                            />
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <h3 className="font-medium text-sm mb-2 line-clamp-2">{doc.title}</h3>
                        <div className="space-y-1 text-xs text-muted-foreground">
                          <div>{formatFileSize(doc.file_size)}</div>
                          <div>{formatDate(doc.created_at)}</div>
                        </div>
                        {doc.tags && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {doc.tags.slice(0, 2).map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {documents.map((doc) => (
                    <Card
                      key={doc.id}
                      className={`cursor-pointer transition-all hover:shadow-sm ${
                        selectedDocs.includes(doc.id) ? 'ring-2 ring-primary' : ''
                      }`}
                      onClick={() => setSelectedDoc(doc)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <Checkbox
                            checked={selectedDocs.includes(doc.id)}
                            onCheckedChange={() => handleDocumentSelect(doc.id)}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <FileText className="h-6 w-6 text-muted-foreground flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-sm mb-1 truncate">{doc.title}</h3>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span>{formatFileSize(doc.file_size)}</span>
                              <span>{formatDate(doc.created_at)}</span>
                              {doc.room_id && <span>Room: {doc.room_id}</span>}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {doc.tags && doc.tags.slice(0, 2).map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Right Sidebar - Properties Panel */}
            {selectedDoc && (
              <div className="w-80 border-l bg-card p-4">
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-3">Properties</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs text-muted-foreground">Name</label>
                        <p className="text-sm font-medium">{selectedDoc.title}</p>
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">Size</label>
                        <p className="text-sm">{formatFileSize(selectedDoc.file_size)}</p>
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">Created</label>
                        <p className="text-sm">{formatDate(selectedDoc.created_at)}</p>
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">Room</label>
                        <p className="text-sm">{selectedDoc.room_id || 'General'}</p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="font-semibold mb-3">Actions</h3>
                    <div className="space-y-2">
                      <Button variant="outline" size="sm" className="w-full justify-start">
                        <Eye className="h-4 w-4 mr-2" />
                        Preview
                      </Button>
                      <Button variant="outline" size="sm" className="w-full justify-start">
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                      <Button variant="outline" size="sm" className="w-full justify-start">
                        <Share className="h-4 w-4 mr-2" />
                        Share
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="font-semibold mb-3">Tags</h3>
                    <div className="flex flex-wrap gap-1">
                      {selectedDoc.tags?.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      )) || <p className="text-sm text-muted-foreground">No tags</p>}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}