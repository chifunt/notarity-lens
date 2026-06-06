import {
  AT_TIMESLOT_LABEL,
  AUSTRIA_PRODUCT_TAG,
  ELIZABETH_FLEXCO_PRODUCT_ID,
  GENERIC_PRODUCT_TAG,
  JOSHUA_NIE_APPLICATION_PRODUCT_ID,
  JOSHUA_NIE_PERSONAL_DATA_PRODUCT_ID,
  NON_AT_TIMESLOT_LABEL,
  ROBERT_POWER_OF_ATTORNEY_PRODUCT_ID,
  SPAIN_NIE_PRODUCT_TAG,
} from "@notarity-lens/shared";

export type ProductRouteBranch = "missing_country" | "austria" | "spain_nie" | "generic";

export type ProductRoute = {
  branch: ProductRouteBranch;
  destinationCountry?: string;
  productTags: string[];
  availableProductIds: string[];
  selectedProductIds: string[];
  autoAddedProductIds: string[];
  timeslotLabel?: string;
};

type ResolveProductRouteInput = {
  destinationCountry?: string | string[];
  selectedProductIds?: string[];
};

function countryIncludes(input: string | string[] | undefined, country: string) {
  if (!input) return false;
  return Array.isArray(input) ? input.includes(country) : input === country;
}

function firstCountry(input: string | string[] | undefined) {
  if (!input) return undefined;
  return Array.isArray(input) ? input[0] : input;
}

export function resolveProductRoute(input: ResolveProductRouteInput): ProductRoute {
  const destinationCountry = firstCountry(input.destinationCountry);
  const selectedProductIds = input.selectedProductIds ?? [];

  if (!destinationCountry) {
    return {
      branch: "missing_country",
      productTags: [],
      availableProductIds: [],
      selectedProductIds,
      autoAddedProductIds: [],
    };
  }

  if (countryIncludes(input.destinationCountry, "AT")) {
    return {
      branch: "austria",
      destinationCountry: "AT",
      productTags: [AUSTRIA_PRODUCT_TAG],
      availableProductIds: [ELIZABETH_FLEXCO_PRODUCT_ID],
      selectedProductIds,
      autoAddedProductIds: [],
      timeslotLabel: AT_TIMESLOT_LABEL,
    };
  }

  if (destinationCountry === "ES") {
    const autoAddedProductIds = selectedProductIds.includes(
      JOSHUA_NIE_APPLICATION_PRODUCT_ID,
    )
      ? [JOSHUA_NIE_PERSONAL_DATA_PRODUCT_ID]
      : [];

    return {
      branch: "spain_nie",
      destinationCountry: "ES",
      productTags: [SPAIN_NIE_PRODUCT_TAG, GENERIC_PRODUCT_TAG],
      availableProductIds: [JOSHUA_NIE_APPLICATION_PRODUCT_ID],
      selectedProductIds,
      autoAddedProductIds,
      timeslotLabel: NON_AT_TIMESLOT_LABEL,
    };
  }

  return {
    branch: "generic",
    destinationCountry,
    productTags: [GENERIC_PRODUCT_TAG],
    availableProductIds: [ROBERT_POWER_OF_ATTORNEY_PRODUCT_ID],
    selectedProductIds,
    autoAddedProductIds: [],
    timeslotLabel: NON_AT_TIMESLOT_LABEL,
  };
}

export function resolveFinalProductIds(route: ProductRoute) {
  return [...route.selectedProductIds, ...route.autoAddedProductIds];
}
