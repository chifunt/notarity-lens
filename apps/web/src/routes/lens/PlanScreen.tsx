import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EditableInferenceFieldCard } from "@/features/lens/components/EditableInferenceFieldCard";
import { ProductRouteCard } from "@/features/lens/components/ProductRouteCard";
import { useLensStore } from "@/features/lens/store";
import { RequireFixture, ScreenFrame } from "./shared";
import { editableFieldsForKeys } from "./inferenceFieldSpecs";

export function PlanScreen() {
  const navigate = useNavigate();
  const confirmRoute = useLensStore((state) => state.confirmRoute);
  const confirmInferenceField = useLensStore((state) => state.confirmInferenceField);
  const markInferenceFieldUnsure = useLensStore((state) => state.markInferenceFieldUnsure);
  const saveInferenceField = useLensStore((state) => state.saveInferenceField);

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
          <div className="mx-auto grid max-w-3xl gap-4">
            <ProductRouteCard
              fixture={fixture}
              onShowEvidence={() => navigate("/lens/evidence")}
            />
            <section className="grid gap-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Edit route details
              </h2>
              {editableFieldsForKeys(fixture.inference, [
                "recommendedProduct",
                "requiredCompanionDocument",
                "apostille",
                "hardCopy",
              ]).map(({ field, spec }) => (
                <EditableInferenceFieldCard
                  key={field.key}
                  field={field}
                  valueType={spec.valueType}
                  addLabel={spec.addLabel}
                  onConfirm={() => confirmInferenceField(field.key)}
                  onUnsure={() => markInferenceFieldUnsure(field.key)}
                  onSave={(value) => saveInferenceField({ key: field.key, value })}
                  onEvidenceSelect={() => navigate("/lens/evidence")}
                />
              ))}
            </section>
          </div>
        </ScreenFrame>
      )}
    </RequireFixture>
  );
}
