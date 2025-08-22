import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, FileText } from "lucide-react";

export default function CreateDoc() {
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState("");
  const [content, setContent] = useState("");
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  async function onCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      // Create a text file blob
      const blob = new Blob([content], { type: 'text/plain' });
      const file = new File([blob], `${fileName}.txt`, { type: 'text/plain' });
      
      // Upload to storage
      const filePath = `${user.id}/${fileName}.txt`;
      const { error: uploadError } = await supabase.storage
        .from('docs')
        .upload(filePath, file);

      if (uploadError) {
        toast({
          title: "Upload Error",
          description: uploadError.message,
          variant: "destructive"
        });
        return;
      }

      // Insert document record
      const { error: dbError } = await supabase.from("documents").insert({
        file_name: `${fileName}.txt`,
        file_type: 'text/plain',
        file_size: blob.size,
        storage_path: filePath,
        user_id: user.id,
        upload_status: 'completed',
        processing_status: 'completed'
      });

      if (dbError) {
        toast({
          title: "Database Error", 
          description: dbError.message,
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Document Created",
        description: "Your document has been created successfully."
      });
      
      navigate("/dashboard");
    } catch (error) {
      console.error('Error creating document:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container mx-auto max-w-2xl p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Create New Document</h1>
        <p className="text-muted-foreground">
          Create a new text document from scratch
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Document Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fileName">Document Name</Label>
              <Input
                id="fileName"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder="Enter document name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Enter your document content..."
                rows={10}
                className="min-h-[200px]"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={loading || !fileName.trim()}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Document"
                )}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => navigate("/dashboard")}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}