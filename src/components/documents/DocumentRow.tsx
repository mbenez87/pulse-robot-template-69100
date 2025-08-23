import { useState } from "react";
import DocumentModal from "./DocumentModal";

export default function DocumentRow({ doc }: { doc: any }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <li
        className="flex items-center justify-between p-3 hover:bg-muted cursor-default select-none rounded-lg border-b last:border-b-0"
        onDoubleClick={() => setOpen(true)}
      >
        <div>
          <div className="font-medium">{doc.title}</div>
          <div className="text-xs text-muted-foreground">{new Date(doc.created_at).toLocaleString()}</div>
        </div>
        <div className="text-xs opacity-70">{doc.mime_type}</div>
      </li>

      {open && <DocumentModal docId={doc.id} onClose={() => setOpen(false)} />}
    </>
  );
}