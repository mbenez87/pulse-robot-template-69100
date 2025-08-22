import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Brain, FileText, Clock, Star, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SearchResult {
  id: string;
  name: string;
  type: string;
  relevanceScore: number;
  snippet: string;
  tags: string[];
  modified: string;
  insights?: string;
}

interface AIDocumentSearchProps {
  onDocumentSelect?: (documentId: string) => void;
}

const AIDocumentSearch = ({ onDocumentSelect }: AIDocumentSearchProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchInsights, setSearchInsights] = useState<string>('');
  const { toast } = useToast();

  const handleSemanticSearch = async () => {
    if (!searchQuery.trim()) {
      toast({
        title: "Enter Search Query",
        description: "Please enter a search query to find documents.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/ai-document-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: searchQuery,
          includeInsights: true 
        })
      });

      const result = await response.json();
      setSearchResults(result.documents || []);
      setSearchInsights(result.insights || '');
      
      if (result.documents?.length === 0) {
        toast({
          title: "No Results Found",
          description: "Try adjusting your search query or using different keywords."
        });
      }
    } catch (error) {
      toast({
        title: "Search Failed",
        description: "Unable to perform search. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSemanticSearch();
    }
  };

  const getRelevanceColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-yellow-600';
    return 'text-gray-600';
  };

  const getFileIcon = (type: string) => {
    return <FileText className="h-4 w-4" />;
  };

  return (
    <div className="space-y-6">
      {/* Search Interface */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI-Powered Document Search
          </CardTitle>
          <CardDescription>
            Use natural language to find documents by content, context, and meaning
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="e.g., 'contracts from last quarter', 'financial reports with revenue data', 'meeting notes about project Alpha'"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1"
            />
            <Button 
              onClick={handleSemanticSearch}
              disabled={loading}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Search Insights */}
      {searchInsights && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Brain className="h-4 w-4" />
              Search Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{searchInsights}</p>
          </CardContent>
        </Card>
      )}

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Search Results ({searchResults.length})</h3>
          
          {searchResults.map((result) => (
            <Card 
              key={result.id} 
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => onDocumentSelect?.(result.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {getFileIcon(result.type)}
                    <div>
                      <h4 className="font-medium">{result.name}</h4>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {result.modified}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className={`text-sm font-medium ${getRelevanceColor(result.relevanceScore)}`}>
                      {Math.round(result.relevanceScore * 100)}% match
                    </div>
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  </div>
                </div>
                
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {result.snippet}
                </p>
                
                {result.insights && (
                  <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border-l-4 border-blue-500">
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      <span className="font-medium">AI Insight:</span> {result.insights}
                    </p>
                  </div>
                )}
                
                <div className="flex flex-wrap gap-2">
                  {result.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {searchResults.length === 0 && searchQuery && !loading && (
        <Card>
          <CardContent className="text-center py-8">
            <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-medium mb-2">No documents found</h3>
            <p className="text-sm text-muted-foreground">
              Try using different keywords or phrases to describe what you're looking for.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AIDocumentSearch;