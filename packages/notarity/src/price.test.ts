import { describe, expect, it } from "vitest";
import { joshuaPriceLines } from "@notarity-lens/shared";
import { confirmedPriceFromLines, totalNetCents } from "./price.js";

describe("price helpers", () => {
  it("sums Joshua price lines to 580 euros", () => {
    expect(totalNetCents(joshuaPriceLines)).toBe(58000);
    expect(confirmedPriceFromLines(joshuaPriceLines)).toBe(580);
  });
});
