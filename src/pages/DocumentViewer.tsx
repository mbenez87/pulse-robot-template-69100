import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Document, Page } from "react-pdf";

type DocMeta = {
  id: string; title: string; file_type: string | null; storage_path?: string;
  file_size?: number | null; created_at: string; updated_at: string;
  width?: number | null; height?: number | null; duration_seconds?: number | null;
  capture_at?: string | null; camera_make?: string | null; camera_model?: string | null;
  gps_lat?: number | null; gps_lon?: number | null; meta?: any;
};

export default function DocumentViewer() {
  const { id } = useParams();
  const nav = useNavigate();
  const [meta, setMeta] = useState<DocMeta | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [numPages, setNumPages] = useState<number>(1);
  const [page, setPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.15);
  const imgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from("documents")
        .select("*")
        .eq("id", id).single();
      if (error || !data) { nav("/documents"); return; }
      setMeta({
        ...data,
        title: data.file_name // Map file_name to title for compatibility
      } as DocMeta);

      if (data.storage_path) {
        const { data: signed } = await supabase.storage.from("docs")
          .createSignedUrl(data.storage_path, 60 * 10);
        setUrl(signed?.signedUrl ?? null);
      }
    })();
  }, [id, nav]);

  const kind = useMemo(() => {
    const m = meta?.file_type || "";
    if (m.startsWith("image/")) return "image";
    if (m.startsWith("video/")) return "video";
    if (m === "application/pdf" || meta?.title?.toLowerCase().endsWith(".pdf")) return "pdf";
    return "other";
  }, [meta]);

  function printView() {
    if (kind === "pdf" && url) { window.open(url, "_blank"); return; }
    if (kind === "image" && imgRef.current) {
      const w = window.open("", "_blank"); if (!w) return;
      w.document.write(`<img src="${imgRef.current.src}" style="max-width:100%"/>`);
      w.document.close(); w.focus(); w.print(); w.close();
    }
  }

  const kb = (meta?.file_size ?? 0) / 1024;

  return (
    <div className="min-h-screen bg-background">
      {/* Toolbar */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-2">
          <button onClick={() => nav(-1)} className="border px-3 py-2 rounded hover:bg-muted">Back</button>
          <div className="ml-2 font-semibold truncate">{meta?.title ?? "Loading…"}</div>
          <div className="flex-1" />
          {kind === "pdf" && (
            <>
              <button className="border px-2 py-2 rounded hover:bg-muted" onClick={() => setPage(p => Math.max(1, p-1))}>◀</button>
              <div className="px-2 text-sm">{page} / {numPages}</div>
              <button className="border px-2 py-2 rounded hover:bg-muted" onClick={() => setPage(p => Math.min(numPages, p+1))}>▶</button>
              <div className="w-px h-6 bg-border mx-2" />
              <button className="border px-3 py-2 rounded hover:bg-muted" onClick={() => setScale(s => Math.max(0.5, s-0.1))}>–</button>
              <div className="px-2 text-sm">{Math.round(scale*100)}%</div>
              <button className="border px-3 py-2 rounded hover:bg-muted" onClick={() => setScale(s => Math.min(3, s+0.1))}>+</button>
            </>
          )}
          {kind === "image" && (
            <>
              <button className="border px-3 py-2 rounded hover:bg-muted" onClick={() => setScale(s => Math.max(0.3, s-0.1))}>–</button>
              <div className="px-2 text-sm">{Math.round(scale*100)}%</div>
              <button className="border px-3 py-2 rounded hover:bg-muted" onClick={() => setScale(s => Math.min(4, s+0.1))}>+</button>
            </>
          )}
          <div className="w-px h-6 bg-border mx-2" />
          {url && <a href={url} target="_blank" className="border px-3 py-2 rounded hover:bg-muted">Open</a>}
          {url && <a href={url} download className="border px-3 py-2 rounded hover:bg-muted">Download</a>}
          {(kind === "pdf" || kind === "image") && (
            <button onClick={printView} className="border px-3 py-2 rounded hover:bg-muted">Print</button>
          )}
        </div>
      </div>

      {/* Content: preview + metadata */}
      <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-8">
          {!url ? (
            <div className="p-12 text-center text-muted-foreground">Loading…</div>
          ) : kind === "video" ? (
            <video src={url} controls className="w-full max-h-[80vh] rounded-lg" />
          ) : kind === "image" ? (
            <div className="overflow-auto border rounded-lg">
              <img
                ref={imgRef}
                src={url}
                className="block origin-top-left"
                style={{ transform: `scale(${scale})`, transformOrigin: "top left" }}
                alt={meta?.title || "Document preview"}
              />
            </div>
          ) : kind === "pdf" ? (
            <div className="flex justify-center">
              <Document file={url} onLoadSuccess={({ numPages }) => setNumPages(numPages)}>
                <Page pageNumber={page} scale={scale} renderTextLayer={false} renderAnnotationLayer={false} />
              </Document>
            </div>
          ) : (
            <div className="p-12 text-center text-muted-foreground">
              Preview not available. Use <a className="underline text-primary" href={url!} target="_blank">Open</a> or <a className="underline text-primary" href={url!} download>Download</a>.
            </div>
          )}
        </div>

        {/* Metadata sidebar */}
        <aside className="col-span-12 lg:col-span-4 space-y-4">
          <div className="border rounded-lg p-4">
            <div className="text-sm font-medium text-primary">File Info</div>
            <ul className="mt-2 text-sm space-y-1">
              <li><b>Type:</b> {meta?.file_type || "—"}</li>
              <li><b>Size:</b> {kb ? `${kb.toFixed(1)} KB` : "—"}</li>
              {(meta?.width && meta?.height) && <li><b>Resolution:</b> {meta.width}×{meta.height}px</li>}
              {meta?.duration_seconds && <li><b>Duration:</b> {meta.duration_seconds.toFixed(1)} s</li>}
              {meta?.capture_at && <li><b>Captured:</b> {new Date(meta.capture_at).toLocaleString()}</li>}
              {(meta?.camera_make || meta?.camera_model) && <li><b>Camera:</b> {[meta.camera_make, meta.camera_model].filter(Boolean).join(" ")}</li>}
              {(meta?.gps_lat && meta?.gps_lon) && <li><b>GPS:</b> {meta.gps_lat}, {meta.gps_lon}</li>}
              <li><b>Created:</b> {meta ? new Date(meta.created_at).toLocaleString() : "—"}</li>
              <li><b>Modified:</b> {meta ? new Date(meta.updated_at).toLocaleString() : "—"}</li>
            </ul>
          </div>

          {meta?.meta && (
            <div className="border rounded-lg p-4">
              <div className="text-sm font-medium text-primary">Additional Metadata</div>
              <pre className="mt-2 bg-muted rounded p-2 text-xs overflow-auto max-h-64">
                {JSON.stringify(meta.meta, null, 2)}
              </pre>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}