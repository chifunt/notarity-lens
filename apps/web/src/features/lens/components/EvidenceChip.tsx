import { Quote } from "lucide-react";
import { cn } from "@/lib/cn";
import type { EvidenceRef } from "../types";

export function EvidenceChip({
  evidence,
  compact = false,
}: {
  evidence: EvidenceRef;
  compact?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm",
        compact ? "px-2 py-1 text-xs" : "px-3 py-1.5 text-sm",
      )}
      title={`${evidence.filename}${evidence.page ? `, page ${evidence.page}` : ""}`}
    >
      <Quote className="h-3.5 w-3.5 text-violet-700" aria-hidden="true" />
      <span className="max-w-[18rem] truncate">{evidence.quote}</span>
    </span>
  );
}
