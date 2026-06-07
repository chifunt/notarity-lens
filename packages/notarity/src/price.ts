import { productFixtures, type AppointmentPayload, type PriceLine } from "@notarity-lens/shared";

export function totalNetCents(lines: PriceLine[]) {
  return lines.reduce((sum, line) => sum + (line.net ?? 0), 0);
}

export function confirmedPriceFromLines(lines: PriceLine[]) {
  return totalNetCents(lines) / 100;
}

export function priceLinesForPayload(payload: AppointmentPayload): PriceLine[] {
  const productLines = payload.products.map((selection, index) => {
    const product = productFixtures.find((fixture) => fixture.id === selection.id);
    const net = product?.baseFee ?? 0;
    return {
      name: product?.title ?? selection.id,
      _product: selection.id,
      amount: 1,
      pricePerUnit: net,
      net,
      identifier: index + 1,
      pricingEnabled: true,
    } satisfies PriceLine;
  });

  if (!payload.hardCopy.hardCopy) return productLines;

  return [
    ...productLines,
    {
      name: "Hard Copy including shipping",
      amount: 1,
      pricePerUnit: 3000,
      net: 3000,
      identifier: productLines.length + 1,
      pricingEnabled: true,
    },
  ];
}

export function formatEuro(amount: number) {
  return new Intl.NumberFormat("en-AT", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
}
