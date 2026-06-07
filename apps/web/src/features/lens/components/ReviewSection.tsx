import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "./StatusBadge";
import type { FieldStatus } from "../types";

export function ReviewSection({
  title,
  rows,
  disabled = false,
}: {
  title: string;
  disabled?: boolean;
  rows: Array<{
    label: string;
    value: ReactNode;
    status: FieldStatus;
    onChange?: () => void;
  }>;
}) {
  return (
    <section className="lens-card-motion rounded-xl border border-border bg-card shadow-[var(--shadow-card)]">
      <div className="border-b border-border px-5 py-4">
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
      </div>
      <div className="divide-y divide-border">
        {rows.map((row, index) => (
          <div
            key={row.label}
            style={{ animationDelay: `${index * 50}ms` }}
            className="lens-receipt-line grid gap-3 px-5 py-4 md:grid-cols-[12rem_1fr_auto_auto] md:items-center"
          >
            <p className="text-sm font-medium text-muted-foreground">{row.label}</p>
            <div className="min-w-0 break-words text-sm text-foreground">{row.value}</div>
            <StatusBadge status={row.status} className="justify-self-start" />
            {row.onChange ? (
              <Button
                variant="ghost"
                size="sm"
                className="justify-self-start md:justify-self-end"
                onClick={row.onChange}
                aria-label={`Change ${row.label}`}
                disabled={disabled}
              >
                Change
              </Button>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}
