export type ConditionOperator =
  | "ISDEFINED"
  | "INCLUDES"
  | "EQUAL"
  | "INTERSECTS"
  | "ISTRUE";

export type Condition = {
  condition: ConditionOperator;
  compare: string;
  value?: unknown;
};

function flattenValue(value: unknown): unknown[] {
  if (Array.isArray(value)) {
    return value.flatMap((item) => flattenValue(item));
  }

  return [value];
}

export function getByPath(state: Record<string, unknown>, path: string): unknown {
  const parts = path.split(".");
  let values: unknown[] = [state];

  for (const part of parts) {
    values = values.flatMap((value) => {
      if (Array.isArray(value)) {
        return value.map((item) =>
          typeof item === "object" && item !== null
            ? (item as Record<string, unknown>)[part]
            : undefined,
        );
      }

      if (typeof value === "object" && value !== null) {
        return [(value as Record<string, unknown>)[part]];
      }

      return [undefined];
    });
  }

  const flattened = values.flatMap((value) => flattenValue(value));
  const defined = flattened.filter(
    (value) => value !== undefined && value !== null && value !== "",
  );

  if (defined.length === 0) return undefined;
  if (defined.length === 1) return defined[0];
  return defined;
}

function asArray(value: unknown): unknown[] {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value : [value];
}

export function evaluateCondition(
  condition: Condition,
  state: Record<string, unknown>,
): boolean {
  const actual = getByPath(state, condition.compare);
  const expected = condition.value;

  switch (condition.condition) {
    case "ISDEFINED":
      return actual !== undefined && actual !== null && actual !== "";
    case "INCLUDES": {
      const expectedValues = asArray(expected);
      const actualValues = asArray(actual);
      return actualValues.some((value) => expectedValues.includes(value));
    }
    case "EQUAL":
      return actual === expected;
    case "INTERSECTS": {
      const expectedValues = asArray(expected);
      const actualValues = asArray(actual);
      return actualValues.some((value) => expectedValues.includes(value));
    }
    case "ISTRUE":
      return actual === true;
  }
}

export function allConditionsPass(
  conditions: Condition[],
  state: Record<string, unknown>,
): boolean {
  return conditions.every((condition) => evaluateCondition(condition, state));
}
