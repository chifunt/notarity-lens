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
    <div className="rounded-lg border border-dashed border-slate-300 bg-white px-6 py-12 text-center shadow-sm">
      <FileUp className="mx-auto h-10 w-10 text-violet-700" aria-hidden="true" />
      <h2 className="mt-4 text-xl font-semibold text-slate-950">Load the Joshua demo</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">
        The demo uses fixture extraction from the provided Joshua documents so the booking
        route, receipt, and payload are reliable.
      </p>
      <Button className="mt-5" onClick={onLoad} disabled={loading}>
        {loading ? "Loading..." : "Load Joshua demo"}
      </Button>
    </div>
  );
}
