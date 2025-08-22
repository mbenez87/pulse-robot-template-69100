import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Brain, FileText, Search, Zap, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AIDocumentActionsProps {
  documentId?: string;
  onAnalysisComplete?: (analysis: any) => void;
}

const AIDocumentActions = ({ documentId, onAnalysisComplete }: AIDocumentActionsProps) => {
  const [loading, setLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [generationPrompt, setGenerationPrompt] = useState('');
  const { toast } = useToast();

  const handleDocumentAnalysis = async () => {
    if (!documentId) {
      toast({
        title: "No Document Selected",
        description: "Please select a document to analyze.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/ai-document-analyzer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId })
      });

      const result = await response.json();
      setAnalysisResult(result);
      onAnalysisComplete?.(result);
      
      toast({
        title: "Analysis Complete",
        description: "Document has been analyzed successfully."
      });
    } catch (error) {
      toast({
        title: "Analysis Failed",
        description: "Unable to analyze document. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleContentExtraction = async (extractionType: string) => {
    if (!documentId) return;

    setLoading(true);
    try {
      const response = await fetch('/api/ai-content-extractor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId, extractionType })
      });

      const result = await response.json();
      
      toast({
        title: "Extraction Complete",
        description: `${extractionType} data extracted successfully.`
      });
    } catch (error) {
      toast({
        title: "Extraction Failed",
        description: "Unable to extract content. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentGeneration = async () => {
    if (!generationPrompt.trim()) {
      toast({
        title: "Missing Prompt",
        description: "Please enter a generation prompt.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/ai-document-generator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          sourceDocumentId: documentId,
          prompt: generationPrompt 
        })
      });

      const result = await response.json();
      
      toast({
        title: "Document Generated",
        description: "New document has been created successfully."
      });
      
      setGenerationPrompt('');
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: "Unable to generate document. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Document Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Document Analysis
          </CardTitle>
          <CardDescription>
            Get AI-powered insights, summaries, and classifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={handleDocumentAnalysis}
            disabled={loading || !documentId}
            className="w-full"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Brain className="h-4 w-4 mr-2" />}
            Analyze Document
          </Button>
          
          {analysisResult && (
            <div className="mt-4 space-y-3">
              <div>
                <h4 className="font-medium mb-2">Summary</h4>
                <p className="text-sm text-muted-foreground">{analysisResult.summary}</p>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {analysisResult.tags?.map((tag: string, index: number) => (
                    <Badge key={index} variant="secondary">{tag}</Badge>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Classification</h4>
                <Badge variant="outline">{analysisResult.classification}</Badge>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Content Extraction */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Content Extraction
          </CardTitle>
          <CardDescription>
            Extract structured data from documents
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <Button 
              variant="outline" 
              onClick={() => handleContentExtraction('financial')}
              disabled={loading || !documentId}
            >
              Financial Data
            </Button>
            <Button 
              variant="outline" 
              onClick={() => handleContentExtraction('legal')}
              disabled={loading || !documentId}
            >
              Legal Terms
            </Button>
            <Button 
              variant="outline" 
              onClick={() => handleContentExtraction('contacts')}
              disabled={loading || !documentId}
            >
              Contact Info
            </Button>
            <Button 
              variant="outline" 
              onClick={() => handleContentExtraction('dates')}
              disabled={loading || !documentId}
            >
              Key Dates
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Document Generation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Document Generation
          </CardTitle>
          <CardDescription>
            Generate new documents from existing ones
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Describe what you want to generate (e.g., 'Create a professional resume based on this CV', 'Generate a summary report', etc.)"
            value={generationPrompt}
            onChange={(e) => setGenerationPrompt(e.target.value)}
            rows={3}
          />
          <Button 
            onClick={handleDocumentGeneration}
            disabled={loading || !generationPrompt.trim()}
            className="w-full"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Zap className="h-4 w-4 mr-2" />}
            Generate Document
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AIDocumentActions;