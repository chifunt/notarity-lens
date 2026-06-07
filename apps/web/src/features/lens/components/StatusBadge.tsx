import { CheckCircle2, CircleAlert, CircleHelp, CircleMinus, Pencil, SearchCheck } from "lucide-react";
import { cn } from "@/lib/cn";
import { statusLabel } from "../format";
import type { FieldStatus } from "../types";

const statusStyles: Record<FieldStatus, string> = {
  inferred: "border-status-inferred bg-status-inferred text-status-inferred-foreground",
  confirmed: "border-status-confirmed bg-status-confirmed text-status-confirmed-foreground",
  needs_review: "border-status-needs-review bg-status-needs-review text-status-needs-review-foreground",
  conflict: "border-status-conflict bg-status-conflict text-status-conflict-foreground",
  missing: "border-status-missing bg-status-missing text-status-missing-foreground",
  edited: "border-status-edited bg-status-edited text-status-edited-foreground",
  not_applicable: "border-border bg-card text-muted-foreground",
};

const statusIcons = {
  inferred: SearchCheck,
  confirmed: CheckCircle2,
  needs_review: CircleHelp,
  conflict: CircleAlert,
  missing: CircleAlert,
  edited: Pencil,
  not_applicable: CircleMinus,
};

export function StatusBadge({ status, className }: { status: FieldStatus; className?: string }) {
  const Icon = statusIcons[status];

  return (
    <span
      className={cn(
        "lens-status-badge inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium",
        status === "confirmed" && "lens-status-badge-confirmed",
        statusStyles[status],
        className,
      )}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {statusLabel(status)}
    </span>
  );
}
