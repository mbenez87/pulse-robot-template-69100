import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type Doc = {
  id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  ai_summary: string | null;
  tags: string[] | null;
  user_id: string;
  parent_folder_id: string | null;
  created_at: string;
  updated_at: string;
  storage_path: string;
  title?: string; // will map from file_name
};

export default function DocumentModal({
  docId,
  onClose,
}: { docId: string; onClose: () => void }) {
  const [doc, setDoc] = useState<Doc | null>(null);
  const [thumbUrl, setThumbUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [tagsInput, setTagsInput] = useState("");

  useEffect(() => {
    (async () => {
      // fetch metadata
      const { data, error } = await supabase.from("documents").select("*").eq("id", docId).single();
      if (!error && data) {
        const docData: Doc = {
          ...data,
          title: data.title || data.file_name,
        };
        setDoc(docData);
        setTagsInput((docData.tags ?? []).join(", "));
        // signed URL for preview (if using storage_path)
        if (data.storage_path) {
          const { data: signed } = await supabase.storage.from("docs")
            .createSignedUrl(data.storage_path, 60);
          setThumbUrl(signed?.signedUrl ?? null);
        }
      }
    })();
  }, [docId]);

  async function saveMeta() {
    if (!doc) return;
    setSaving(true);
    const tags = tagsInput.split(",").map(t => t.trim()).filter(Boolean);
    await supabase.from("documents")
      .update({ file_name: doc.title || doc.file_name, tags })
      .eq("id", doc.id);
    setSaving(false);
  }

  async function refreshSummary() {
    if (!doc) return;
    setSaving(true);
    try {
      // Call the edge function to regenerate summary
      const { data } = await supabase.functions.invoke('generate-document-summary', {
        body: { documentId: doc.id }
      });
      if (data) {
        setDoc(prev => prev ? { ...prev, ai_summary: data.summary } : prev);
      }
    } catch (error) {
      console.error('Error refreshing summary:', error);
    } finally {
      setSaving(false);
    }
  }

  function prettySize(bytes?: number | null) {
    if (!bytes) return "—";
    const u = ["B","KB","MB","GB"]; let i = 0; let v = bytes;
    while (v >= 1024 && i < u.length-1) { v/=1024; i++; }
    return `${v.toFixed(1)} ${u[i]}`;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-background rounded-xl shadow-xl w-[860px] max-w-[95vw] max-h-[85vh] overflow-hidden border">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-5 py-3">
          <input
            className="font-semibold text-lg w-full mr-4 outline-none bg-transparent"
            value={doc?.title || doc?.file_name || ""}
            onChange={(e) => setDoc(d => d ? { ...d, title: e.target.value } : d)}
          />
          <button onClick={onClose} className="text-sm border px-3 py-1 rounded hover:bg-muted">Close</button>
        </div>

        {/* Body */}
        <div className="grid grid-cols-12 gap-5 p-5 overflow-auto">
          {/* Left: preview */}
          <div className="col-span-5">
            <div className="border rounded-lg overflow-hidden bg-muted aspect-[4/5] flex items-center justify-center">
              {thumbUrl ? (
                // For PDFs/images we can show the asset directly; for DOC/XLS show icon.
                doc?.file_type?.startsWith("image/") ? (
                  <img src={thumbUrl} className="max-w-full max-h-full" />
                ) : doc?.file_type === "application/pdf" ? (
                  <iframe src={thumbUrl} className="w-full h-full" />
                ) : (
                  <div className="text-sm text-muted-foreground p-4">No inline preview. Use Download/Open.</div>
                )
              ) : (
                <div className="text-sm text-muted-foreground">Generating preview…</div>
              )}
            </div>

            <div className="mt-3 flex gap-2 flex-wrap">
              <button 
                onClick={() => window.location.href = `/viewer/${doc?.id}`}
                className="bg-primary text-primary-foreground px-3 py-2 rounded text-sm hover:bg-primary/90"
              >
                View Full Screen
              </button>
              <a
                href={thumbUrl ?? "#"}
                target="_blank"
                className="border px-3 py-2 rounded text-sm hover:bg-muted"
              >Open</a>
              <button className="border px-3 py-2 rounded text-sm hover:bg-muted">Download</button>
              <button className="border px-3 py-2 rounded text-sm hover:bg-muted">Duplicate</button>
              <button className="border px-3 py-2 rounded text-sm text-destructive hover:bg-destructive/10">Delete</button>
            </div>
          </div>

          {/* Right: details */}
          <div className="col-span-7">
            <div>
              <div className="text-sm font-medium text-primary">AI Mini-summary</div>
              <div className="mt-1 text-sm text-muted-foreground whitespace-pre-line">
                {doc?.ai_summary || "No summary yet."}
              </div>
              <div className="mt-2">
                <button 
                  onClick={refreshSummary}
                  disabled={saving}
                  className="border px-3 py-1 rounded text-sm hover:bg-muted disabled:opacity-50"
                >
                  {saving ? "Refreshing..." : "Refresh summary"}
                </button>
              </div>
            </div>

            <div className="mt-5">
              <div className="text-sm font-medium text-primary">Tags</div>
              <input
                className="mt-1 border rounded-md px-3 py-2 text-sm w-full bg-background"
                placeholder="comma, separated, tags"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
              />
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
              <Detail label="Type" value={doc?.file_type || "—"} />
              <Detail label="Size" value={prettySize(doc?.file_size)} />
              <Detail label="Pages" value="—" />
              <Detail label="Folder" value={doc?.parent_folder_id ? "In folder" : "All Files"} />
              <Detail label="Created" value={doc ? new Date(doc.created_at).toLocaleString() : "—"} />
              <Detail label="Modified" value={doc ? new Date(doc.updated_at).toLocaleString() : "—"} />
            </div>

            <div className="mt-5 flex gap-2">
              <button onClick={saveMeta} className="bg-primary text-primary-foreground px-4 py-2 rounded text-sm hover:bg-primary/90" disabled={saving}>
                {saving ? "Saving…" : "Save changes"}
              </button>
              <button onClick={onClose} className="border px-4 py-2 rounded text-sm hover:bg-muted">Cancel</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: any }) {
  return (
    <div className="border rounded-lg p-3 bg-background">
      <div className="text-muted-foreground">{label}</div>
      <div className="font-medium">{String(value)}</div>
    </div>
  );
}