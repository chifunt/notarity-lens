import { Check, HelpCircle, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatFieldValue } from "../display";
import type { EvidenceRef, InferredField } from "../types";
import { EvidenceChip } from "./EvidenceChip";
import { StatusBadge } from "./StatusBadge";

export function InferenceFieldCard({
  field,
  onConfirm,
  onEdit,
  onUnsure,
  onEvidenceSelect,
}: {
  field: InferredField;
  onConfirm?: () => void;
  onEdit?: () => void;
  onUnsure?: () => void;
  onEvidenceSelect?: (evidence: EvidenceRef) => void;
}) {
  return (
    <article className="rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase text-muted-foreground">{field.label}</p>
          <h3 className="mt-1 text-lg font-semibold text-foreground">
            {formatFieldValue(field)}
          </h3>
        </div>
        <StatusBadge status={field.status} />
      </div>
      {field.explanation ? (
        <p className="mt-3 text-sm leading-6 text-muted-foreground">{field.explanation}</p>
      ) : null}
      {field.evidence.length ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {field.evidence.map((evidence) => (
            <EvidenceChip
              key={evidence.id}
              evidence={evidence}
              compact
              onSelect={onEvidenceSelect}
            />
          ))}
        </div>
      ) : null}
      {(onConfirm || onEdit || onUnsure) && field.status !== "confirmed" ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {onConfirm ? (
            <Button type="button" size="sm" onClick={onConfirm}>
              <Check className="h-3.5 w-3.5" aria-hidden="true" />
              Confirm
            </Button>
          ) : null}
          {onEdit ? (
            <Button type="button" size="sm" variant="outline" onClick={onEdit}>
              <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
              Edit
            </Button>
          ) : null}
          {onUnsure ? (
            <Button type="button" size="sm" variant="ghost" onClick={onUnsure}>
              <HelpCircle className="h-3.5 w-3.5" aria-hidden="true" />
              I am not sure
            </Button>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
