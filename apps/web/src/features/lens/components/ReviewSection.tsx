import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "./StatusBadge";
import type { FieldStatus } from "../types";

export function ReviewSection({
  title,
  rows,
}: {
  title: string;
  rows: Array<{ label: string; value: ReactNode; status: FieldStatus }>;
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-5 py-4">
        <h2 className="text-base font-semibold text-slate-950">{title}</h2>
      </div>
      <div className="divide-y divide-slate-200">
        {rows.map((row) => (
          <div key={row.label} className="grid gap-3 px-5 py-4 md:grid-cols-[12rem_1fr_auto_auto] md:items-center">
            <p className="text-sm font-medium text-slate-500">{row.label}</p>
            <div className="min-w-0 break-words text-sm text-slate-950">{row.value}</div>
            <StatusBadge status={row.status} />
            <Button variant="ghost" className="justify-self-start md:justify-self-end">
              Change
            </Button>
          </div>
        ))}
      </div>
    </section>
  );
}
