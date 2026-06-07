import { useEffect, useState } from "react";
import { Check, HelpCircle, Pencil, Plus, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatFieldValue } from "../display";
import type { EvidenceRef, InferredField } from "../types";
import { EvidenceChip } from "./EvidenceChip";
import { StatusBadge } from "./StatusBadge";

export type EditableFieldValueType = "text" | "boolean";

function rawInputValue(field: InferredField) {
  if (typeof field.value === "boolean") return field.value ? "true" : "false";
  if (field.status === "missing" && field.value === "") return "";
  return String(field.value ?? "");
}

function parsedInputValue(value: string, valueType: EditableFieldValueType) {
  if (valueType === "boolean") return value === "true";
  return value;
}

export function EditableInferenceFieldCard({
  field,
  valueType = "text",
  addLabel = "Add",
  onConfirm,
  onEvidenceSelect,
  onSave,
  onUnsure,
}: {
  field: InferredField;
  valueType?: EditableFieldValueType;
  addLabel?: string;
  onConfirm?: () => void;
  onEvidenceSelect?: (evidence: EvidenceRef) => void;
  onSave: (value: string | boolean) => void;
  onUnsure?: () => void;
}) {
  const fieldIsMissing = field.status === "missing" && field.value === "";
  const [editing, setEditing] = useState(fieldIsMissing);
  const [draftValue, setDraftValue] = useState(rawInputValue(field));

  useEffect(() => {
    setDraftValue(rawInputValue(field));
    setEditing(field.status === "missing" && field.value === "");
  }, [field]);

  const save = () => {
    onSave(parsedInputValue(draftValue, valueType));
    setEditing(false);
  };

  return (
    <article className="rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase text-muted-foreground">
            {field.label}
          </p>
          {editing ? (
            <div className="mt-2">
              {valueType === "boolean" ? (
                <select
                  value={draftValue}
                  onChange={(event) => setDraftValue(event.currentTarget.value)}
                  className="min-h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <option value="true">Required</option>
                  <option value="false">Not needed</option>
                </select>
              ) : (
                <input
                  value={draftValue}
                  onChange={(event) => setDraftValue(event.currentTarget.value)}
                  placeholder="Enter the correct value"
                  className="min-h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                />
              )}
            </div>
          ) : (
            <h3 className="mt-1 break-words text-lg font-semibold text-foreground">
              {fieldIsMissing ? "Not provided" : formatFieldValue(field)}
            </h3>
          )}
        </div>
        <StatusBadge status={field.status} />
      </div>

      {field.explanation ? (
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          {field.explanation}
        </p>
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
      ) : (
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          No document citation is attached to this value.
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {editing ? (
          <>
            <Button
              type="button"
              size="sm"
              onClick={save}
              disabled={valueType === "text" && !draftValue.trim()}
            >
              <Save className="h-3.5 w-3.5" aria-hidden="true" />
              Save
            </Button>
            {!fieldIsMissing ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  setDraftValue(rawInputValue(field));
                  setEditing(false);
                }}
              >
                Cancel
              </Button>
            ) : null}
          </>
        ) : (
          <>
            {onConfirm && field.status !== "confirmed" ? (
              <Button type="button" size="sm" onClick={onConfirm}>
                <Check className="h-3.5 w-3.5" aria-hidden="true" />
                Confirm
              </Button>
            ) : null}
            <Button
              type="button"
              size="sm"
              variant={fieldIsMissing ? undefined : "outline"}
              onClick={() => setEditing(true)}
            >
              {fieldIsMissing ? (
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              ) : (
                <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              {fieldIsMissing ? addLabel : "Edit"}
            </Button>
            {onUnsure ? (
              <Button type="button" size="sm" variant="ghost" onClick={onUnsure}>
                <HelpCircle className="h-3.5 w-3.5" aria-hidden="true" />
                I am not sure
              </Button>
            ) : null}
          </>
        )}
      </div>
    </article>
  );
}
