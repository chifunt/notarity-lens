import { useState } from "react";
import { Code2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AppointmentPayload } from "../types";

export function PayloadPreview({ payload }: { payload: AppointmentPayload }) {
  const [open, setOpen] = useState(false);

  return (
    <section className="lens-card-motion rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Code2 className="h-5 w-5 text-primary" aria-hidden="true" />
          <h2 className="text-base font-semibold text-foreground">Payload preview</h2>
        </div>
        <Button type="button" variant="outline" onClick={() => setOpen((value) => !value)}>
          {open ? "Hide payload" : "Show payload"}
        </Button>
      </div>
      {open ? (
        <pre className="lens-screen-enter mt-4 max-h-[28rem] overflow-auto rounded-md bg-foreground p-4 text-xs leading-5 text-primary-foreground">
          {JSON.stringify(payload, null, 2)}
        </pre>
      ) : null}
    </section>
  );
}
