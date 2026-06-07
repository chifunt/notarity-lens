import type {
  EditableFieldValueType,
} from "@/features/lens/components/EditableInferenceFieldCard";
import type {
  DocumentFactExtraction,
  FieldStatus,
  InferredField,
} from "@/features/lens/types";

export type EditableFieldSpec = {
  key: string;
  label: string;
  valueType: EditableFieldValueType;
  addLabel?: string;
};

const fieldSpecs: Record<string, EditableFieldSpec> = {
  apostille: {
    key: "apostille",
    label: "Apostille",
    valueType: "boolean",
  },
  billingAddress: {
    key: "billingAddress",
    label: "Billing/home address",
    valueType: "text",
    addLabel: "Add billing",
  },
  countryOfUse: {
    key: "countryOfUse",
    label: "Country of use",
    valueType: "text",
  },
  hardCopy: {
    key: "hardCopy",
    label: "Hard copy",
    valueType: "boolean",
  },
  participant: {
    key: "participant",
    label: "Participant",
    valueType: "text",
    addLabel: "Add participant",
  },
  participantEmail: {
    key: "participantEmail",
    label: "Participant email",
    valueType: "text",
    addLabel: "Add email",
  },
  recommendedProduct: {
    key: "recommendedProduct",
    label: "Recommended product",
    valueType: "text",
  },
  requiredCompanionDocument: {
    key: "requiredCompanionDocument",
    label: "Required companion document",
    valueType: "text",
    addLabel: "Add companion",
  },
  shippingAddress: {
    key: "shippingAddress",
    label: "Shipping address",
    valueType: "text",
    addLabel: "Add shipping",
  },
};

function missingField(spec: EditableFieldSpec): InferredField {
  return {
    key: spec.key,
    label: spec.label,
    value: "",
    status: "missing" satisfies FieldStatus,
    evidence: [],
    explanation: "Add this if the document did not provide enough information.",
    requiresConfirmation: true,
  };
}

function fieldByKey(inference: DocumentFactExtraction, key: string) {
  if (key === "countryOfUse") return inference.countryOfUse;
  return [
    ...inference.products,
    ...inference.people,
    inference.billingAddress,
    inference.shippingAddress,
    inference.apostille,
    inference.hardCopy,
  ].find((field) => field?.key === key);
}

export function editableFieldForKey(
  inference: DocumentFactExtraction,
  key: keyof typeof fieldSpecs,
) {
  const spec = fieldSpecs[key];
  return {
    field: fieldByKey(inference, spec.key) ?? missingField(spec),
    spec,
  };
}

export function editableFieldsForKeys(
  inference: DocumentFactExtraction,
  keys: Array<keyof typeof fieldSpecs>,
) {
  return keys.map((key) => editableFieldForKey(inference, key));
}

export function editableEvidenceGroups(inference: DocumentFactExtraction) {
  const existingParticipantAmbiguity = inference.people.find(
    (field) => field.key === "participantAmbiguity",
  );

  return [
    {
      title: "Country and route",
      fields: editableFieldsForKeys(inference, [
        "countryOfUse",
        "recommendedProduct",
        "requiredCompanionDocument",
        "apostille",
        "hardCopy",
      ]),
    },
    {
      title: "People and addresses",
      fields: [
        ...editableFieldsForKeys(inference, [
          "participant",
          "participantEmail",
          "billingAddress",
          "shippingAddress",
        ]),
        ...(existingParticipantAmbiguity
          ? [
              {
                field: existingParticipantAmbiguity,
                spec: {
                  key: "participantAmbiguity",
                  label: "Participant ambiguity",
                  valueType: "text" as const,
                },
              },
            ]
          : []),
      ],
    },
  ];
}
