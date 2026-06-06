import { FileText } from "lucide-react";
import type { DocumentFactExtraction } from "../types";
import { EvidenceChip } from "./EvidenceChip";

export function PdfPreviewPanel({ inference }: { inference: DocumentFactExtraction }) {
  const allEvidence = [
    inference.countryOfUse,
    ...inference.products,
    ...inference.people,
    inference.billingAddress,
    inference.shippingAddress,
    inference.apostille,
    inference.hardCopy,
  ].flatMap((field) => field?.evidence ?? []);

  return (
    <aside className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 p-4">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-violet-700" aria-hidden="true" />
          <h2 className="text-base font-semibold text-slate-950">Document evidence</h2>
        </div>
        <p className="mt-1 text-sm text-slate-600">
          We found this in your document. Please confirm before we use it.
        </p>
      </div>
      <div className="grid gap-4 p-4">
        {inference.documents.map((document) => (
          <section key={document.id} className="rounded-md border border-slate-200 bg-slate-50 p-3">
            <p className="text-sm font-medium text-slate-950">{document.canonicalName}</p>
            <div className="mt-3 grid gap-3">
              {document.textByPage.map((page) => (
                <div key={page.page} className="rounded-md bg-white p-3 text-sm leading-6 text-slate-700">
                  <p className="mb-2 text-xs font-medium uppercase text-slate-500">
                    Page {page.page}
                  </p>
                  {page.text}
                </div>
              ))}
            </div>
          </section>
        ))}
        <section>
          <p className="text-sm font-medium text-slate-950">Evidence chips</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {allEvidence.map((evidence) => (
              <EvidenceChip key={evidence.id} evidence={evidence} compact />
            ))}
          </div>
        </section>
      </div>
    </aside>
  );
}
