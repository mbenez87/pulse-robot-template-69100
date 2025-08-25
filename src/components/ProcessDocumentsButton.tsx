import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Zap } from 'lucide-react';

export function ProcessDocumentsButton() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleProcessDocuments = async () => {
    if (!user) return;

    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('process-documents', {
        body: { user_id: user.id }
      });

      if (error) throw error;

      toast({
        title: "Documents processed successfully!",
        description: `Processed ${data.processedDocuments} documents for search. ${data.skippedDocuments} were already processed.`
      });
    } catch (error) {
      console.error('Error processing documents:', error);
      toast({
        title: "Processing failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Button 
      onClick={handleProcessDocuments} 
      disabled={isProcessing}
      variant="outline"
      className="flex items-center gap-2"
    >
      {isProcessing ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Zap className="h-4 w-4" />
      )}
      {isProcessing ? 'Processing...' : 'Enable Search'}
    </Button>
  );
}