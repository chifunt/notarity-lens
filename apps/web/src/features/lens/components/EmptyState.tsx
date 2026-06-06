import { FileUp } from "lucide-react";
import { Button } from "@/components/ui/button";

export function EmptyState({
  onLoad,
  loading,
}: {
  onLoad: () => void;
  loading: boolean;
}) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-card px-6 py-12 text-center shadow-[var(--shadow-card)]">
      <FileUp className="mx-auto h-10 w-10 text-primary" aria-hidden="true" />
      <h2 className="mt-4 text-xl font-semibold text-foreground">Upload documents first</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
        Use a sample request to preload documents, route, receipt, and payload
        data for a safe draft review.
      </p>
      <Button className="mt-5" onClick={onLoad} disabled={loading}>
        {loading ? "Loading..." : "Use sample request"}
      </Button>
    </div>
  );
}
