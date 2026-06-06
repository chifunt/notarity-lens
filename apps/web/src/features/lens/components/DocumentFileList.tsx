import { FileText, Link2 } from "lucide-react";
import type { ExtractedDocument } from "../types";

export function DocumentFileList({ documents }: { documents: ExtractedDocument[] }) {
  return (
    <div className="grid gap-3">
      {documents.map((document) => (
        <div
          key={document.id}
          className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm"
        >
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-md bg-violet-50 text-violet-800">
              <FileText className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-slate-950">{document.filename}</p>
              <p className="text-xs text-slate-500">
                Canonical payload name: {document.canonicalName}
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-800">
            <Link2 className="h-3.5 w-3.5" aria-hidden="true" />
            Mapped
          </span>
        </div>
      ))}
    </div>
  );
}
