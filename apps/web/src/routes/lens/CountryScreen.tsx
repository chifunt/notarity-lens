import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CountrySemanticsCard } from "@/features/lens/components/CountrySemanticsCard";
import { useLensStore } from "@/features/lens/store";
import { RequireFixture, ScreenFrame } from "./shared";

export function CountryScreen() {
  const navigate = useNavigate();
  const confirmCountry = useLensStore((state) => state.confirmCountry);

  return (
    <RequireFixture>
      {(fixture) => (
        <ScreenFrame
          railAction={
            <Button
              type="button"
              className="w-full"
              onClick={() => {
                confirmCountry();
                navigate("/lens/plan");
              }}
            >
              Continue
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          }
        >
          <div className="mx-auto max-w-3xl">
            <CountrySemanticsCard
              inference={fixture.inference}
              payload={fixture.payload}
              onShowEvidence={() => navigate("/lens/evidence")}
            />
          </div>
        </ScreenFrame>
      )}
    </RequireFixture>
  );
}
