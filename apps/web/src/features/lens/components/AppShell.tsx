import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { ShieldCheck } from "lucide-react";
import { getApiHealth } from "../api";
import { TopStepper } from "./TopStepper";

export function AppShell({
  children,
  rightRail,
}: {
  children: ReactNode;
  rightRail?: ReactNode;
}) {
  const health = useQuery({
    queryKey: ["api-health"],
    queryFn: getApiHealth,
    retry: false,
    refetchOnWindowFocus: false,
  });

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex w-full max-w-[1480px] items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <img
              src="/notarity-logo-name.svg"
              alt="Notarity"
              className="h-8 w-auto shrink-0"
            />
            <span className="hidden rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary sm:inline-flex">
              Lens
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-status-confirmed-foreground" aria-hidden="true" />
            <span>{health.data?.ok ? "API connected" : "Mock-safe mode"}</span>
          </div>
        </div>
      </header>
      <TopStepper />
      <main className="mx-auto w-full max-w-[1480px] flex-1 px-4 py-6 sm:px-6 sm:py-8">
        {rightRail ? (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-8">
            <div className="min-w-0">{children}</div>
            <aside className="lg:sticky lg:top-6 lg:self-start">{rightRail}</aside>
          </div>
        ) : (
          children
        )}
      </main>
      <footer className="border-t border-border bg-primary text-primary-foreground/80">
        <div className="mx-auto flex w-full max-w-[1480px] flex-col items-start justify-between gap-1 px-4 py-4 text-xs sm:flex-row sm:items-center sm:px-6">
          <span>Notarity Lens. The document becomes the booking path.</span>
          <span>Nothing is submitted until you confirm.</span>
        </div>
      </footer>
    </div>
  );
}
