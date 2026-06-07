import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LiveReceipt } from "@/features/lens/components/LiveReceipt";
import { PreparationTimeline } from "@/features/lens/components/PreparationTimeline";
import { ReceiptSidebar } from "@/features/lens/components/ReceiptSidebar";
import { RequireFixture, ScreenFrame } from "./shared";

export function CostScreen() {
  const navigate = useNavigate();

  return (
    <RequireFixture>
      {(fixture, price) => (
        <ScreenFrame sidebar={false}>
          <div className="mx-auto max-w-5xl">
            <div>
              <h1 className="text-3xl font-semibold text-foreground">Cost and next steps</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                See the itemized price before choosing the appointment details.
              </p>
            </div>
            <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]">
              <PreparationTimeline fixture={fixture} />
              {price ? (
                <LiveReceipt
                  price={price}
                  action={
                    <Button
                      type="button"
                      className="w-full"
                      onClick={() => navigate("/lens/appointment")}
                    >
                      Continue
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  }
                />
              ) : (
                <ReceiptSidebar
                  price={null}
                  action={
                    <Button type="button" className="w-full" disabled>
                      Continue
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  }
                />
              )}
            </div>
          </div>
        </ScreenFrame>
      )}
    </RequireFixture>
  );
}
