import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { ShieldCheck } from "lucide-react";
import { getApiHealth } from "../api";
import { TopStepper } from "./TopStepper";

export function AppShell({ children }: { children: ReactNode }) {
  const health = useQuery({
    queryKey: ["api-health"],
    queryFn: getApiHealth,
    retry: false,
    refetchOnWindowFocus: false,
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-slate-950">Notarity Lens</p>
            <p className="text-xs text-slate-500">The document becomes the booking path.</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <ShieldCheck className="h-4 w-4 text-emerald-700" aria-hidden="true" />
            <span>{health.data?.ok ? "Mock API connected" : "Mock mode"}</span>
          </div>
        </div>
      </header>
      <TopStepper />
      <div className="mx-auto max-w-7xl px-4 py-8">{children}</div>
    </div>
  );
}
