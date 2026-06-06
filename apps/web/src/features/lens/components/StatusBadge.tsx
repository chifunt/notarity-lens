import { CheckCircle2, CircleAlert, CircleHelp, CircleMinus, Pencil, SearchCheck } from "lucide-react";
import { cn } from "@/lib/cn";
import { statusLabel } from "../format";
import type { FieldStatus } from "../types";

const statusStyles: Record<FieldStatus, string> = {
  inferred: "border-blue-200 bg-blue-50 text-blue-800",
  confirmed: "border-emerald-200 bg-emerald-50 text-emerald-800",
  needs_review: "border-amber-200 bg-amber-50 text-amber-900",
  conflict: "border-rose-200 bg-rose-50 text-rose-800",
  missing: "border-slate-300 bg-slate-100 text-slate-800",
  edited: "border-violet-200 bg-violet-50 text-violet-800",
  not_applicable: "border-slate-200 bg-white text-slate-600",
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
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium",
        statusStyles[status],
        className,
      )}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {statusLabel(status)}
    </span>
  );
}
