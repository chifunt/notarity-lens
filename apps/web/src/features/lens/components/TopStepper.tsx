import { Link, useLocation } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { lensSteps } from "../steps";

const visibleSteps = lensSteps.filter((step) => step.id !== "submit");

export function TopStepper() {
  const location = useLocation();
  const currentIndex = Math.max(
    0,
    visibleSteps.findIndex((step) => step.path === location.pathname),
  );
  const currentStep = visibleSteps[currentIndex] ?? visibleSteps[0];

  return (
    <nav aria-label="Booking progress" className="border-b border-border bg-card">
      <div className="mx-auto w-full max-w-[1480px] px-4 py-3 sm:px-6 sm:py-4">
        <div className="mb-2 flex items-center justify-between sm:hidden">
          <span className="text-[11px] font-medium uppercase text-muted-foreground">
            Step {currentIndex + 1} of {visibleSteps.length}
          </span>
          <span className="truncate text-sm font-semibold text-foreground">
            {currentStep?.label}
          </span>
        </div>

        <div className="flex w-full items-center gap-1">
          {visibleSteps.map((step, index) => {
            const done = index < currentIndex;
            const active = index === currentIndex;
            const reachable = index <= currentIndex;
            const segment = (
              <div
                className={cn(
                  "h-1.5 w-full rounded-full transition-colors",
                  (done || active) && "bg-primary",
                  !done && !active && "bg-muted",
                )}
              />
            );

            return (
              <div key={step.id} className="min-w-0 flex-1">
                {reachable ? (
                  <Link
                    to={step.path}
                    aria-label={step.label}
                    aria-current={active ? "step" : undefined}
                    className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    {segment}
                  </Link>
                ) : (
                  segment
                )}
              </div>
            );
          })}
        </div>

        <ol className="mt-3 hidden grid-cols-9 gap-1 sm:grid">
          {visibleSteps.map((step, index) => {
            const done = index < currentIndex;
            const active = index === currentIndex;
            const reachable = index <= currentIndex;
            const Icon = step.icon;
            const inner = (
              <div
                className={cn(
                  "flex items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors",
                  active && "bg-accent/50",
                  !active && reachable && "hover:bg-accent/30",
                )}
              >
                <span
                  className={cn(
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold",
                    active && "bg-primary text-primary-foreground",
                    done && "bg-primary/15 text-primary",
                    !active && !done && "bg-muted text-muted-foreground",
                  )}
                  aria-hidden="true"
                >
                  {done ? (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  ) : (
                    <Icon className="h-3.5 w-3.5" />
                  )}
                </span>
                <span
                  className={cn(
                    "truncate text-xs font-medium",
                    active ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {step.label}
                </span>
              </div>
            );

            return (
              <li key={step.id}>
                {reachable ? (
                  <Link
                    to={step.path}
                    aria-current={active ? "step" : undefined}
                    className="block rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    {inner}
                  </Link>
                ) : (
                  <div aria-disabled="true" className="cursor-not-allowed opacity-70">
                    {inner}
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
}
