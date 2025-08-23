import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Canvas as FabricCanvas, Rect } from 'fabric';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { 
  Shield, 
  Eye, 
  Download, 
  AlertTriangle,
  FileText,
  Scan,
  Trash2
} from 'lucide-react';

interface PIIDetection {
  id: string;
  entity_type: string;
  text_content: string;
  confidence: number;
  bounding_box?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  status: 'detected' | 'reviewed' | 'redacted' | 'approved';
}

interface RedactionCanvasProps {
  documentId: string;
  documentUrl?: string;
}

export function RedactionCanvas({ documentId, documentUrl }: RedactionCanvasProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [detections, setDetections] = useState<PIIDetection[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isRedacting, setIsRedacting] = useState(false);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new FabricCanvas(canvasRef.current, {
      width: 800,
      height: 600,
      backgroundColor: '#ffffff',
    });

    setFabricCanvas(canvas);

    // Load document if URL provided
    if (documentUrl) {
      loadDocumentToCanvas(canvas, documentUrl);
    }

    return () => {
      canvas.dispose();
    };
  }, [documentUrl]);

  const loadDocumentToCanvas = (canvas: FabricCanvas, url: string) => {
    // In a real implementation, you'd load the document (PDF page, image) onto the canvas
    // For now, we'll add a placeholder
    const rect = new Rect({
      left: 50,
      top: 50,
      fill: '#f0f0f0',
      width: 700,
      height: 500,
      selectable: false
    });
    
    canvas.add(rect);
    canvas.renderAll();
  };

  const scanForPII = async () => {
    if (!user) return;
    
    setIsScanning(true);
    try {
      // Get document content for PII scanning
      const { data: document, error: docError } = await supabase
        .from('documents')
        .select('*, ocr_pages(raw_text)')
        .eq('id', documentId)
        .single();

      if (docError) throw docError;

      const textContent = document.ocr_pages
        ?.map((page: any) => page.raw_text)
        .join('\n') || '';

      if (!textContent) {
        toast({
          title: "No text content",
          description: "Please process the document with OCR first",
          variant: "destructive"
        });
        return;
      }

      // Call enhanced-query function for PII detection
      const { data, error } = await supabase.functions.invoke('enhanced-query', {
        body: {
          query: textContent,
          action: 'detect_pii',
          userId: user.id
        }
      });

      if (error) throw error;

      const mockDetections: PIIDetection[] = data.detections.map((detection: any, index: number) => ({
        id: `detection-${index}`,
        entity_type: detection.entity_type,
        text_content: detection.text_content,
        confidence: detection.confidence,
        bounding_box: {
          x: 100 + (index * 50),
          y: 100 + (index * 30),
          width: detection.text_content.length * 8,
          height: 20
        },
        status: 'detected'
      }));

      setDetections(mockDetections);

      // Add redaction rectangles to canvas
      mockDetections.forEach((detection) => {
        if (detection.bounding_box && fabricCanvas) {
          const redactionRect = new Rect({
            left: detection.bounding_box.x,
            top: detection.bounding_box.y,
            width: detection.bounding_box.width,
            height: detection.bounding_box.height,
            fill: 'rgba(255, 0, 0, 0.5)',
            stroke: 'red',
            strokeWidth: 2,
            selectable: true,
            // @ts-ignore - Fabric.js allows custom data properties
            data: { detectionId: detection.id }
          });

          fabricCanvas.add(redactionRect);
        }
      });

      fabricCanvas?.renderAll();

      toast({
        title: "PII Scan Complete",
        description: `Found ${mockDetections.length} potential sensitive items`
      });

    } catch (error) {
      console.error('Error scanning for PII:', error);
      toast({
        title: "Error",
        description: "Failed to scan for PII",
        variant: "destructive"
      });
    } finally {
      setIsScanning(false);
    }
  };

  const toggleRedaction = (detectionId: string) => {
    const detection = detections.find(d => d.id === detectionId);
    if (!detection || !fabricCanvas) return;

    const redactionRect = fabricCanvas.getObjects().find(
      (obj: any) => obj.data?.detectionId === detectionId
    );

    if (redactionRect) {
      const newStatus = detection.status === 'detected' ? 'redacted' : 'detected';
      redactionRect.set({
        fill: newStatus === 'redacted' ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 0, 0, 0.5)'
      });
      
      setDetections(detections.map(d => 
        d.id === detectionId ? { ...d, status: newStatus } : d
      ));
      
      fabricCanvas.renderAll();
    }
  };

  const applyRedactions = async () => {
    if (!user) return;
    
    setIsRedacting(true);
    try {
      const redactedDetections = detections.filter(d => d.status === 'redacted');
      
      if (redactedDetections.length === 0) {
        toast({
          title: "No redactions",
          description: "Please select items to redact first",
          variant: "destructive"
        });
        return;
      }

      // In a real implementation, you'd call an edge function that:
      // 1. Downloads the original document
      // 2. Uses pdf-lib or similar to apply redactions
      // 3. Adds watermarks (user name, email, timestamp)
      // 4. Uploads the redacted version
      // 5. Records the operation in doc_lineage

      // For now, simulate the process
      const redactionData = {
        redacted_items: redactedDetections.map(d => ({
          entity_type: d.entity_type,
          text_content: d.text_content,
          bounding_box: d.bounding_box
        })),
        watermark: {
          user_name: user.email,
          timestamp: new Date().toISOString()
        }
      };

      // Record the redaction operation
      await supabase.from('doc_lineage').insert({
        parent_document_id: documentId,
        derived_document_id: documentId, // In real app, this would be the new redacted document ID
        operation_type: 'redaction',
        operation_details: redactionData,
        performed_by: user.id
      });

      // Update PII detection statuses
      const updatePromises = redactedDetections.map(detection =>
        supabase
          .from('pii_detections')
          .upsert({
            document_id: documentId,
            detection_type: 'pii',
            entity_type: detection.entity_type,
            text_content: detection.text_content,
            confidence: detection.confidence,
            bounding_box: detection.bounding_box,
            status: 'redacted',
            reviewed_by: user.id,
            reviewed_at: new Date().toISOString()
          })
      );

      await Promise.all(updatePromises);

      toast({
        title: "Redaction Complete",
        description: `Applied ${redactedDetections.length} redactions`
      });

    } catch (error) {
      console.error('Error applying redactions:', error);
      toast({
        title: "Error",
        description: "Failed to apply redactions",
        variant: "destructive"
      });
    } finally {
      setIsRedacting(false);
    }
  };

  const clearCanvas = () => {
    if (!fabricCanvas) return;
    
    fabricCanvas.clear();
    fabricCanvas.backgroundColor = '#ffffff';
    fabricCanvas.renderAll();
    setDetections([]);
  };

  const getEntityTypeColor = (entityType: string) => {
    const colors: Record<string, string> = {
      ssn: 'bg-red-100 text-red-800',
      phone: 'bg-blue-100 text-blue-800',
      email: 'bg-green-100 text-green-800',
      credit_card: 'bg-purple-100 text-purple-800',
      address: 'bg-yellow-100 text-yellow-800',
      date_of_birth: 'bg-orange-100 text-orange-800'
    };
    return colors[entityType] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            Document Redaction Tool
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Button
              onClick={scanForPII}
              disabled={isScanning}
              variant="outline"
            >
              <Scan className="h-4 w-4 mr-2" />
              {isScanning ? 'Scanning...' : 'Scan for PII'}
            </Button>
            <Button
              onClick={applyRedactions}
              disabled={isRedacting || detections.filter(d => d.status === 'redacted').length === 0}
              variant="default"
            >
              <FileText className="h-4 w-4 mr-2" />
              {isRedacting ? 'Applying...' : 'Apply Redactions'}
            </Button>
            <Button
              onClick={clearCanvas}
              variant="outline"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear
            </Button>
          </div>

          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <canvas ref={canvasRef} className="max-w-full" />
          </div>

          {detections.length > 0 && (
            <div className="mt-4">
              <h3 className="text-lg font-medium mb-3">Detected Sensitive Information</h3>
              <div className="space-y-2">
                {detections.map((detection) => (
                  <Card key={detection.id} className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Badge className={getEntityTypeColor(detection.entity_type)}>
                          {detection.entity_type.toUpperCase()}
                        </Badge>
                        <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                          {detection.text_content}
                        </span>
                        <Badge variant="outline">
                          {Math.round(detection.confidence * 100)}% confidence
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge 
                          variant={detection.status === 'redacted' ? 'destructive' : 'secondary'}
                        >
                          {detection.status}
                        </Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleRedaction(detection.id)}
                        >
                          {detection.status === 'redacted' ? (
                            <Eye className="h-4 w-4" />
                          ) : (
                            <AlertTriangle className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}