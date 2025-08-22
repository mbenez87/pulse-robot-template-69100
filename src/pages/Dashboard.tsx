import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, FileText, Upload, Plus } from "lucide-react";

interface Document {
  id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  created_at: string;
  upload_status: string | null;
}

export default function Dashboard() {
  const [docs, setDocs] = useState<Document[] | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const fetchDocuments = async () => {
      try {
        const { data, error } = await supabase
          .from("documents")
          .select("id, file_name, file_type, file_size, created_at, upload_status")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error fetching documents:", error);
          return;
        }

        setDocs(data ?? []);
      } catch (error) {
        console.error("Unexpected error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!docs || docs.length === 0) {
    return (
      <div className="container mx-auto max-w-4xl p-6">
        <div className="text-center py-16">
          <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-2xl font-semibold mb-2">No documents yet</h2>
          <p className="text-muted-foreground mb-6">
            Upload or create your first document to get started.
          </p>
          <div className="flex gap-3 justify-center">
            <Button asChild>
              <Link to="/documents">
                <Upload className="h-4 w-4 mr-2" />
                Upload Document
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/create">
                <Plus className="h-4 w-4 mr-2" />
                New Document
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Your Documents</h1>
        <p className="text-muted-foreground">
          Manage and organize your document collection
        </p>
      </div>

      <div className="mb-6 flex gap-3">
        <Button asChild>
          <Link to="/create">
            <Plus className="h-4 w-4 mr-2" />
            Create Document
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/documents">
            <Upload className="h-4 w-4 mr-2" />
            Upload Document
          </Link>
        </Button>
      </div>

      <div className="grid gap-4">
        {docs.map((doc) => (
          <Card key={doc.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">
                <Link 
                  to={`/documents/${doc.id}`}
                  className="hover:text-primary transition-colors"
                >
                  {doc.file_name}
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Created {new Date(doc.created_at).toLocaleDateString()}</span>
                <Button variant="ghost" size="sm" asChild>
                  <Link to={`/documents/${doc.id}`}>
                    View
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}