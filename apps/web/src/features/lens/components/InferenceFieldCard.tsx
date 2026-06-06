import { Button } from "@/components/ui/button";
import type { InferredField } from "../types";
import { EvidenceChip } from "./EvidenceChip";
import { StatusBadge } from "./StatusBadge";

function displayValue(field: InferredField) {
  if (field.key === "countryOfUse" && field.value === "ES") return "Spain";
  if (field.key === "recommendedProduct" && field.value === "nie_number_application") {
    return "NIE number application";
  }
  if (field.key === "requiredCompanionDocument" && field.value === "nie_personal_data") {
    return "NIE Personal Data";
  }
  if (field.key === "apostille" && field.value === true) return "Required";
  if (field.key === "hardCopy" && field.value === true) return "Required";
  return String(field.value);
}

export function InferenceFieldCard({
  field,
  onConfirm,
}: {
  field: InferredField;
  onConfirm?: () => void;
}) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{field.label}</p>
          <h3 className="mt-1 text-lg font-semibold text-slate-950">
            {displayValue(field)}
          </h3>
        </div>
        <StatusBadge status={field.status} />
      </div>
      {field.explanation ? (
        <p className="mt-3 text-sm leading-6 text-slate-600">{field.explanation}</p>
      ) : null}
      {field.evidence.length ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {field.evidence.map((evidence) => (
            <EvidenceChip key={evidence.id} evidence={evidence} compact />
          ))}
        </div>
      ) : null}
      {onConfirm ? (
        <div className="mt-4 flex gap-2">
          <Button type="button" variant="outline" onClick={onConfirm}>
            Confirm
          </Button>
          <Button type="button" variant="ghost">
            Change
          </Button>
        </div>
      ) : null}
    </article>
  );
}
