import { Quote } from "lucide-react";
import { cn } from "@/lib/cn";
import type { EvidenceRef } from "../types";

export function EvidenceChip({
  evidence,
  compact = false,
  onSelect,
}: {
  evidence: EvidenceRef;
  compact?: boolean;
  onSelect?: (evidence: EvidenceRef) => void;
}) {
  const className = cn(
    "inline-flex max-w-full items-center gap-1.5 rounded-full border border-border bg-card text-muted-foreground shadow-sm",
    compact ? "px-2 py-1 text-xs" : "px-3 py-1.5 text-sm",
    onSelect && "transition-colors hover:border-primary/40 hover:bg-accent/20 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
  );
  const title = `${evidence.filename}${evidence.page ? `, page ${evidence.page}` : ""}`;
  const content = (
    <>
      <Quote className="h-3.5 w-3.5 text-violet-700" aria-hidden="true" />
      <span className="max-w-[18rem] truncate">{evidence.quote}</span>
    </>
  );

  if (onSelect) {
    return (
      <button
        type="button"
        className={className}
        title={title}
        aria-label={`Show evidence in ${title}`}
        onClick={() => onSelect(evidence)}
      >
        {content}
      </button>
    );
  }

  return (
    <span className={className} title={title}>
      {content}
    </span>
  );
}
