import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Document, Page } from "react-pdf";

type DocMeta = {
  id: string; title: string; mime_type: string | null; storage_path?: string;
  size_bytes?: number | null; created_at: string; updated_at: string;
  width?: number | null; height?: number | null; duration_seconds?: number | null;
};

export default function DocumentViewer() {
  const { id } = useParams();
  const nav = useNavigate();
  const [meta, setMeta] = useState<DocMeta | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [numPages, setNumPages] = useState(1);
  const [page, setPage] = useState(1);
  const [scale, setScale] = useState(1);                 // zoom for image/pdf
  const imgRef = useRef<HTMLImageElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);  // for pan

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from("documents").select("*").eq("id", id).single();
      if (error || !data) { nav("/dashboard"); return; }
      setMeta({
        ...data,
        title: data.file_name,
        mime_type: data.file_type,
        size_bytes: data.file_size
      });
      if (data.storage_path) {
        const { data: signed } = await supabase.storage.from("docs").createSignedUrl(data.storage_path, 600);
        setUrl(signed?.signedUrl ?? null);
      }
    })();
  }, [id, nav]);

  const kind = useMemo(() => {
    const m = meta?.mime_type || "";
    if (m.startsWith("image/")) return "image";
    if (m.startsWith("video/")) return "video";
    if (m === "application/pdf" || meta?.title?.toLowerCase().endsWith(".pdf")) return "pdf";
    return "other";
  }, [meta]);

  // Print helper
  function handlePrint() {
    if (!url) return;
    if (kind === "pdf") { window.open(url, "_blank"); return; }
    if (kind === "image") {
      const w = window.open("", "_blank"); if (!w) return;
      w.document.write(`<img src="${url}" style="max-width:100%;"/>`);
      w.document.close(); w.focus(); w.print(); w.close();
    }
  }

  // Basic pan for zoomed images
  useEffect(() => {
    if (kind !== "image") return;
    const el = stageRef.current; if (!el) return;
    let down = false, sx = 0, sy = 0, sl = 0, st = 0;
    const onDown = (e: MouseEvent) => { if (scale <= 1) return; down = true; sx = e.clientX; sy = e.clientY; sl = el.scrollLeft; st = el.scrollTop; el.style.cursor = "grabbing"; };
    const onMove = (e: MouseEvent) => { if (!down) return; el.scrollLeft = sl - (e.clientX - sx); el.scrollTop = st - (e.clientY - sy); };
    const onUp = () => { down = false; el.style.cursor = "default"; };
    el.addEventListener("mousedown", onDown); window.addEventListener("mousemove", onMove); window.addEventListener("mouseup", onUp);
    return () => { el.removeEventListener("mousedown", onDown); window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  }, [scale, kind]);

  return (
    <div className="min-h-screen w-full bg-[#0b1230] text-white">
      {/* Top toolbar (floating) */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-white/10 backdrop-blur border border-white/15 text-white rounded-xl px-3 py-2">
        <button onClick={() => nav(-1)} className="px-3 py-1 rounded hover:bg-white/10">Back</button>
        <div className="mx-2 truncate max-w-[42vw]">{meta?.title ?? "Loading…"}</div>
        <div className="w-px h-6 bg-white/20" />
        {kind === "pdf" && (
          <>
            <button className="px-2 py-1 rounded hover:bg-white/10" onClick={() => setPage(p => Math.max(1, p-1))}>◀</button>
            <div className="text-sm">{page} / {numPages}</div>
            <button className="px-2 py-1 rounded hover:bg-white/10" onClick={() => setPage(p => Math.min(numPages, p+1))}>▶</button>
            <div className="w-px h-6 bg-white/20" />
          </>
        )}
        {(kind === "image" || kind === "pdf") && (
          <>
            <button className="px-2 py-1 rounded hover:bg-white/10" onClick={() => setScale(s => Math.max(0.25, +(s - 0.1).toFixed(2)))}>–</button>
            <div className="text-sm">{Math.round(scale * 100)}%</div>
            <button className="px-2 py-1 rounded hover:bg-white/10" onClick={() => setScale(s => Math.min(4, +(s + 0.1).toFixed(2)))}>+</button>
            <button className="px-2 py-1 rounded hover:bg-white/10" onClick={() => setScale(1)}>Fit</button>
          </>
        )}
        <div className="w-px h-6 bg-white/20" />
        {url && <a href={url} target="_blank" className="px-3 py-1 rounded hover:bg-white/10">Open</a>}
        {url && <a href={url} download className="px-3 py-1 rounded hover:bg-white/10">Download</a>}
        {(kind === "image" || kind === "pdf") && <button onClick={handlePrint} className="px-3 py-1 rounded hover:bg-white/10">Print</button>}
      </div>

      {/* Dark canvas with subtle vignette like pro viewers */}
      <div
        ref={stageRef}
        className="h-screen w-full overflow-auto"
        style={{
          background:
            "radial-gradient(1200px 600px at 50% 40%, rgba(34,60,180,0.35), rgba(11,18,48,1) 60%)",
        }}
      >
        {/* Centering frame */}
        <div className="min-h-screen w-full flex items-center justify-center p-8">
          {!url ? (
            <div className="text-white/70">Loading…</div>
          ) : kind === "video" ? (
            <video
              src={url}
              controls
              className="rounded-lg shadow-2xl"
              style={{ maxWidth: "90vw", maxHeight: "85vh" }}
            />
          ) : kind === "image" ? (
            <img
              ref={imgRef}
              src={url}
              className="rounded-lg shadow-2xl select-none"
              style={{
                /* Contain within viewport, then scale for zoom */
                maxWidth: "90vw",
                maxHeight: "85vh",
                transform: `scale(${scale})`,
                transformOrigin: "center center",
              }}
              draggable={false}
            />
          ) : kind === "pdf" ? (
            <div className="rounded-lg shadow-2xl bg-black/30 p-2">
              <Document file={url} onLoadSuccess={({ numPages }) => setNumPages(numPages)} loading={<div className="text-white/70 p-8">Rendering PDF…</div>}>
                <Page pageNumber={page} scale={scale} renderTextLayer={false} renderAnnotationLayer={false} />
              </Document>
            </div>
          ) : (
            <div className="text-white/70">
              Preview not available. Use <a className="underline" href={url} target="_blank" rel="noreferrer">Open</a> or <a className="underline" href={url} download>Download</a>.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}