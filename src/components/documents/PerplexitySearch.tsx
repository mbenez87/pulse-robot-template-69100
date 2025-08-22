import React, { useState } from 'react';
import { Search, Globe, Clock, Image, ExternalLink, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface PerplexitySearchProps {
  className?: string;
}

interface SearchResult {
  content: string;
  related_questions: string[];
  images: string[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export const PerplexitySearch: React.FC<PerplexitySearchProps> = ({ className }) => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [includeImages, setIncludeImages] = useState(false);
  const [recencyFilter, setRecencyFilter] = useState('month');
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!query.trim()) {
      toast({
        title: "Query Required",
        description: "Please enter a search query",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/perplexity-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          includeImages,
          recencyFilter
        }),
      });

      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data = await response.json();
      setResult(data);
      
      toast({
        title: "Search Complete",
        description: "Real-time web search results retrieved successfully"
      });
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Search Failed",
        description: "Unable to perform web search. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      handleSearch();
    }
  };

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary" />
            Perplexity Web Search
            <Badge variant="secondary">Real-time</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Input */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Search the web with AI intelligence..."
                className="pl-10"
                disabled={isLoading}
              />
            </div>
            <Button 
              onClick={handleSearch} 
              disabled={isLoading || !query.trim()}
              className="flex items-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              Search
            </Button>
          </div>

          {/* Search Options */}
          <div className="flex flex-wrap gap-2 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={includeImages}
                onChange={(e) => setIncludeImages(e.target.checked)}
                className="rounded border-input"
              />
              <Image className="w-4 h-4" />
              Include Images
            </label>
            
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <select
                value={recencyFilter}
                onChange={(e) => setRecencyFilter(e.target.value)}
                className="border border-input rounded px-2 py-1 text-sm bg-background"
              >
                <option value="hour">Last Hour</option>
                <option value="day">Last Day</option>
                <option value="week">Last Week</option>
                <option value="month">Last Month</option>
                <option value="year">Last Year</option>
              </select>
            </div>
          </div>

          {/* Search Results */}
          {result && (
            <div className="space-y-4 mt-6">
              {/* Main Response */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">AI Response</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none">
                    <div className="whitespace-pre-wrap text-sm leading-relaxed">
                      {result.content}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Related Questions */}
              {result.related_questions && result.related_questions.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Related Questions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {result.related_questions.map((question, index) => (
                        <button
                          key={index}
                          onClick={() => setQuery(question)}
                          className="block w-full text-left p-3 rounded border border-border hover:bg-accent transition-colors text-sm"
                        >
                          <div className="flex items-center gap-2">
                            <ExternalLink className="w-4 h-4 text-muted-foreground" />
                            {question}
                          </div>
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Images */}
              {result.images && result.images.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Related Images</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {result.images.map((imageUrl, index) => (
                        <div key={index} className="relative aspect-square">
                          <img
                            src={imageUrl}
                            alt={`Search result ${index + 1}`}
                            className="w-full h-full object-cover rounded border border-border"
                            loading="lazy"
                          />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Usage Stats */}
              {result.usage && (
                <div className="text-xs text-muted-foreground">
                  Tokens used: {result.usage.total_tokens} ({result.usage.prompt_tokens} prompt + {result.usage.completion_tokens} completion)
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};