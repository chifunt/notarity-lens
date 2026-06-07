import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductRouteCard } from "@/features/lens/components/ProductRouteCard";
import { useLensStore } from "@/features/lens/store";
import { RequireFixture, ScreenFrame } from "./shared";

export function PlanScreen() {
  const navigate = useNavigate();
  const confirmRoute = useLensStore((state) => state.confirmRoute);

  return (
    <RequireFixture>
      {(fixture) => (
        <ScreenFrame
          railAction={
            <Button
              type="button"
              className="w-full"
              onClick={() => {
                confirmRoute();
                navigate("/lens/cost");
              }}
            >
              Continue
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          }
        >
          <div className="mx-auto max-w-3xl">
            <ProductRouteCard
              fixture={fixture}
              onShowEvidence={() => navigate("/lens/evidence")}
            />
          </div>
        </ScreenFrame>
      )}
    </RequireFixture>
  );
}
