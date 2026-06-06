import { describe, expect, it } from "vitest";
import { evaluateCondition } from "./condition-engine.js";
import { resolveProductRoute } from "./product-resolver.js";

describe("condition engine", () => {
  it("evaluates documented operators", () => {
    const state = {
      destinationCountry: "ES",
      products: [{ id: "UpEJ7raQEKQKFhWn12r2" }],
      hardCopy: { hardCopy: true },
    };

    expect(
      evaluateCondition(
        { condition: "ISDEFINED", compare: "destinationCountry" },
        state,
      ),
    ).toBe(true);
    expect(
      evaluateCondition(
        { condition: "INCLUDES", compare: "destinationCountry", value: ["AT", "ES"] },
        state,
      ),
    ).toBe(true);
    expect(
      evaluateCondition(
        { condition: "EQUAL", compare: "destinationCountry", value: "ES" },
        state,
      ),
    ).toBe(true);
    expect(
      evaluateCondition(
        {
          condition: "INTERSECTS",
          compare: "products.id",
          value: ["UpEJ7raQEKQKFhWn12r2"],
        },
        state,
      ),
    ).toBe(true);
    expect(
      evaluateCondition({ condition: "ISTRUE", compare: "hardCopy.hardCopy" }, state),
    ).toBe(true);
  });

  it("ES route exposes the NIE application path", () => {
    const route = resolveProductRoute({ destinationCountry: "ES" });

    expect(route.branch).toBe("spain_nie");
    expect(route.productTags).toEqual(["HdippWIH77AdMywneldY", "t7t78Pbrs5nEyHTqDuQv"]);
    expect(route.availableProductIds).toContain("UpEJ7raQEKQKFhWn12r2");
  });

  it("NIE application auto-adds NIE Personal Data", () => {
    const route = resolveProductRoute({
      destinationCountry: "ES",
      selectedProductIds: ["UpEJ7raQEKQKFhWn12r2"],
    });

    expect(route.autoAddedProductIds).toEqual(["xK5IkgPX1LTYdWLFzW8X"]);
  });

  it("AT route uses the Austria branch", () => {
    const route = resolveProductRoute({ destinationCountry: "AT" });

    expect(route.branch).toBe("austria");
    expect(route.productTags).toEqual(["5DVjVha92EJnyyO6138f"]);
    expect(route.availableProductIds).toContain("S3N2zyJENFE0vTjrKTZn");
    expect(route.timeslotLabel).toBe("yYD129MD1NizqtQKkLqN");
  });

  it("generic non-AT/non-ES route uses the generic branch", () => {
    const route = resolveProductRoute({ destinationCountry: "LT" });

    expect(route.branch).toBe("generic");
    expect(route.productTags).toEqual(["t7t78Pbrs5nEyHTqDuQv"]);
    expect(route.availableProductIds).toContain("ujwBkZleJLPEzByCnPCS");
  });
});
