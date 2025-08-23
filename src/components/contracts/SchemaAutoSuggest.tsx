import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Database, FileText, CheckCircle, XCircle, AlertTriangle, Code, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const SchemaAutoSuggest = () => {
  const [selectedDocument, setSelectedDocument] = useState<string>('');
  const [customText, setCustomText] = useState('');
  const [useCustomText, setUseCustomText] = useState(false);
  const queryClient = useQueryClient();

  // Fetch documents for schema generation
  const { data: documents } = useQuery({
    queryKey: ['documents-for-schema'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('documents')
        .select('id, file_name, created_at')
        .eq('is_folder', false)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch schema history
  const { data: schemaHistory, isLoading: historyLoading } = useQuery({
    queryKey: ['schema-history'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('schema_history')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  // Generate schema suggestion
  const generateSchema = useMutation({
    mutationFn: async ({ documentId, text }: { documentId?: string; text?: string }) => {
      if (!documentId && !text) {
        throw new Error('Either document ID or custom text is required');
      }

      let extractedText = text;
      
      if (documentId && !text) {
        // First extract text from document using OCR
        const { data: ocrData, error: ocrError } = await supabase.functions.invoke('ocr-extract', {
          body: {
            documentId: documentId,
            method: 'gemini-1.5-pro'
          }
        });
        
        if (ocrError) throw ocrError;
        extractedText = ocrData.extracted_text;
      }

      // Generate schema suggestion
      const { data, error } = await supabase.functions.invoke('schema-auto-suggest', {
        body: {
          documentId: documentId || 'custom',
          extractedText: extractedText,
          action: 'suggest'
        }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Schema generated",
        description: "AI has successfully analyzed the document and suggested a database schema.",
      });
      queryClient.invalidateQueries({ queryKey: ['schema-history'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to generate schema suggestion",
        variant: "destructive",
      });
    }
  });

  // Approve schema
  const approveSchema = useMutation({
    mutationFn: async (schemaHistoryId: string) => {
      const { data, error } = await supabase.functions.invoke('schema-auto-suggest', {
        body: {
          schemaHistoryId: schemaHistoryId,
          action: 'approve'
        }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Schema approved",
        description: "The schema has been approved and is ready for implementation.",
      });
      queryClient.invalidateQueries({ queryKey: ['schema-history'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to approve schema",
        variant: "destructive",
      });
    }
  });

  // Implement schema
  const implementSchema = useMutation({
    mutationFn: async (schemaHistoryId: string) => {
      const { data, error } = await supabase.functions.invoke('schema-auto-suggest', {
        body: {
          schemaHistoryId: schemaHistoryId,
          action: 'implement'
        }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: "Schema implemented",
        description: `Successfully created ${data.tables_created?.length || 0} tables in the database.`,
      });
      queryClient.invalidateQueries({ queryKey: ['schema-history'] });
    },
    onError: (error: any) => {
      toast({
        title: "Implementation failed",
        description: error.message || "Failed to implement schema",
        variant: "destructive",
      });
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'implemented': return "default";
      case 'approved': return "outline";
      case 'suggested': return "secondary";
      case 'rejected': return "destructive";
      default: return "outline";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'implemented': return CheckCircle;
      case 'approved': return CheckCircle;
      case 'suggested': return AlertTriangle;
      case 'rejected': return XCircle;
      default: return AlertTriangle;
    }
  };

  const handleGenerate = () => {
    if (useCustomText) {
      if (!customText.trim()) {
        toast({
          title: "Error",
          description: "Please enter some text to analyze",
          variant: "destructive",
        });
        return;
      }
      generateSchema.mutate({ text: customText });
    } else {
      if (!selectedDocument) {
        toast({
          title: "Error",
          description: "Please select a document",
          variant: "destructive",
        });
        return;
      }
      generateSchema.mutate({ documentId: selectedDocument });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Schema Auto-Suggest</h2>
          <p className="text-muted-foreground">
            AI-powered database schema generation from documents
          </p>
        </div>
      </div>

      {/* Generate Schema */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Zap className="mr-2 h-5 w-5" />
            Generate New Schema
          </CardTitle>
          <CardDescription>
            Analyze a document or custom text to automatically suggest database schemas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs value={useCustomText ? "text" : "document"} onValueChange={(v) => setUseCustomText(v === "text")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="document">From Document</TabsTrigger>
              <TabsTrigger value="text">Custom Text</TabsTrigger>
            </TabsList>
            
            <TabsContent value="document" className="space-y-4">
              <Select value={selectedDocument} onValueChange={setSelectedDocument}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a document to analyze..." />
                </SelectTrigger>
                <SelectContent>
                  {documents?.map((doc) => (
                    <SelectItem key={doc.id} value={doc.id}>
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4" />
                        <span>{doc.file_name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </TabsContent>
            
            <TabsContent value="text" className="space-y-4">
              <Textarea
                placeholder="Paste your document content or data structure here..."
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                rows={8}
              />
            </TabsContent>
          </Tabs>
          
          <Button
            onClick={handleGenerate}
            disabled={generateSchema.isPending}
            className="w-full"
          >
            <Database className="mr-2 h-4 w-4" />
            {generateSchema.isPending ? 'Analyzing...' : 'Generate Schema Suggestion'}
          </Button>
        </CardContent>
      </Card>

      {/* Schema History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Database className="mr-2 h-5 w-5" />
            Schema History
          </CardTitle>
          <CardDescription>
            View and manage AI-generated schema suggestions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {historyLoading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-muted rounded animate-pulse" />
              ))}
            </div>
          ) : schemaHistory && schemaHistory.length > 0 ? (
            <div className="space-y-4">
              {schemaHistory.map((schema) => {
                const StatusIcon = getStatusIcon(schema.status);
                
                return (
                  <div
                    key={schema.id}
                    className="border rounded-lg p-4 space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <StatusIcon className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <h4 className="font-medium">
                            {schema.schema_description || 'Generated Schema'}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            Created {new Date(schema.created_at).toLocaleDateString()} • 
                            Model: {schema.ai_model} • 
                            Confidence: {(schema.confidence_score * 100).toFixed(0)}%
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={getStatusColor(schema.status)}>
                          {schema.status}
                        </Badge>
                        {schema.status === 'suggested' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => approveSchema.mutate(schema.id)}
                            disabled={approveSchema.isPending}
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Approve
                          </Button>
                        )}
                        {schema.status === 'approved' && (
                          <Button
                            size="sm"
                            onClick={() => implementSchema.mutate(schema.id)}
                            disabled={implementSchema.isPending}
                          >
                            <Database className="mr-2 h-4 w-4" />
                            {implementSchema.isPending ? 'Implementing...' : 'Implement'}
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Schema Preview */}
                    <Tabs defaultValue="tables" className="w-full">
                      <TabsList>
                        <TabsTrigger value="tables">Tables</TabsTrigger>
                        <TabsTrigger value="sql">SQL Migration</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="tables" className="mt-4">
                        <div className="space-y-4">
                          {((schema.suggested_schema as any)?.tables || []).map((table: any, index: number) => (
                            <div key={index} className="border rounded p-3">
                              <div className="flex items-center justify-between mb-2">
                                <h5 className="font-medium">{table.name}</h5>
                                <Badge variant="outline">{table.columns?.length || 0} columns</Badge>
                              </div>
                              {table.description && (
                                <p className="text-sm text-muted-foreground mb-3">
                                  {table.description}
                                </p>
                              )}
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Column</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Nullable</TableHead>
                                    <TableHead>Constraints</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {table.columns?.map((column: any, colIndex: number) => (
                                    <TableRow key={colIndex}>
                                      <TableCell className="font-medium">
                                        {column.name}
                                        {column.primary_key && (
                                          <Badge variant="outline" className="ml-2">PK</Badge>
                                        )}
                                      </TableCell>
                                      <TableCell>
                                        <Badge variant="secondary">{column.type}</Badge>
                                      </TableCell>
                                      <TableCell>
                                        <Badge variant={column.nullable ? "outline" : "secondary"}>
                                          {column.nullable ? 'Yes' : 'No'}
                                        </Badge>
                                      </TableCell>
                                      <TableCell>
                                        {column.constraints?.map((constraint: string, cIndex: number) => (
                                          <Badge key={cIndex} variant="outline" className="mr-1">
                                            {constraint}
                                          </Badge>
                                        ))}
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          ))}
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="sql" className="mt-4">
                        <div className="relative">
                          <pre className="bg-muted p-4 rounded text-sm overflow-x-auto">
                            <code>{schema.migration_sql}</code>
                          </pre>
                          <Button
                            size="sm"
                            variant="outline"
                            className="absolute top-2 right-2"
                            onClick={() => {
                              navigator.clipboard.writeText(schema.migration_sql);
                              toast({
                                title: "Copied",
                                description: "SQL migration copied to clipboard",
                              });
                            }}
                          >
                            <Code className="h-4 w-4" />
                          </Button>
                        </div>
                      </TabsContent>
                    </Tabs>

                    {/* Implementation Status */}
                    {schema.status === 'implemented' && schema.table_names && (
                      <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
                        <h5 className="font-medium text-green-800 mb-2">Successfully Implemented</h5>
                        <p className="text-sm text-green-700">
                          Created tables: {schema.table_names.join(', ')}
                        </p>
                        {schema.implemented_at && (
                          <p className="text-xs text-green-600 mt-1">
                            Implemented on {new Date(schema.implemented_at).toLocaleString()}
                          </p>
                        )}
                      </div>
                    )}

                    {schema.status === 'rejected' && schema.rejected_reason && (
                      <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
                        <h5 className="font-medium text-red-800 mb-2">Implementation Failed</h5>
                        <p className="text-sm text-red-700">{schema.rejected_reason}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No schema suggestions yet. Generate your first schema from a document above.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SchemaAutoSuggest;