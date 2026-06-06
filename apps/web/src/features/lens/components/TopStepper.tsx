import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/cn";
import { lensSteps } from "../steps";

const visibleSteps = lensSteps.filter((step) => step.id !== "submit");

export function TopStepper() {
  const location = useLocation();

  return (
    <nav aria-label="Booking progress" className="overflow-x-auto border-b border-slate-200 bg-white">
      <ol className="mx-auto flex max-w-7xl items-center gap-1 px-4 py-3">
        {visibleSteps.map((step) => {
          const active = location.pathname === step.path;
          const Icon = step.icon;

          return (
            <li key={step.id}>
              <Link
                to={step.path}
                className={cn(
                  "inline-flex h-9 items-center gap-2 rounded-md px-3 text-sm font-medium text-slate-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-700",
                  active && "bg-violet-50 text-violet-900",
                  !active && "hover:bg-slate-100",
                )}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {step.label}
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
