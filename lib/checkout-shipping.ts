import type { CheckoutCustomer, CheckoutOrderItem } from "@/lib/checkout-orders";
import { calculateDiscountedCheckoutAmountPaise } from "@/lib/checkout-discounts";

export type CheckoutShippingOption = {
  id: string;
  methodId: string;
  instanceId?: number;
  title: string;
  total: number;
};

type WooShippingZone = {
  id: number;
  name?: string;
};

type WooShippingZoneLocation = {
  code?: string;
  type?: "country" | "state" | "postcode" | "continent";
};

type WooShippingMethod = {
  instance_id?: number;
  method_id?: string;
  method_title?: string;
  title?: string;
  enabled?: boolean | "yes" | "no";
  settings?: Record<string, { value?: unknown }>;
};

function getWooCredentials() {
  const siteUrl = process.env.WORDPRESS_SITE_URL;
  const consumerKey = process.env.WOOCOMMERCE_CONSUMER_KEY;
  const consumerSecret = process.env.WOOCOMMERCE_CONSUMER_SECRET;

  if (!siteUrl || !consumerKey || !consumerSecret) {
    throw new Error("WooCommerce credentials are not configured.");
  }

  return { siteUrl, consumerKey, consumerSecret };
}

function getWooHeaders(consumerKey: string, consumerSecret: string) {
  return {
    Accept: "application/json",
    Authorization: `Basic ${Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64")}`
  };
}

function normalizeCountry(value: string) {
  return value.trim().toLowerCase() === "india" ? "IN" : value.trim().toUpperCase();
}

function normalizeState(value: string) {
  return value.trim().toUpperCase();
}

function readAmount(value: unknown) {
  if (value === undefined || value === null || value === "") {
    return 0;
  }

  const parsed = Number(String(value ?? "").replace(/[^0-9.]/g, ""));

  return Number.isFinite(parsed) ? parsed : 0;
}

async function getWooJson<T>(path: string): Promise<T> {
  const { siteUrl, consumerKey, consumerSecret } = getWooCredentials();
  const endpoint = new URL(path, siteUrl);
  const response = await fetch(endpoint, {
    headers: getWooHeaders(consumerKey, consumerSecret),
    cache: "no-store"
  });
  const data = (await response.json().catch(() => null)) as T;

  if (!response.ok) {
    throw new Error("Could not load WooCommerce shipping settings.");
  }

  return data;
}

async function getOptionalWooJson<T>(path: string): Promise<T | null> {
  const { siteUrl, consumerKey, consumerSecret } = getWooCredentials();
  const endpoint = new URL(path, siteUrl);
  const response = await fetch(endpoint, {
    headers: getWooHeaders(consumerKey, consumerSecret),
    cache: "no-store"
  });

  if (!response.ok) {
    return null;
  }

  return response.json().catch(() => null) as Promise<T | null>;
}

function postcodeMatches(pattern: string, postcode: string) {
  const normalizedPattern = pattern.trim().toUpperCase();
  const normalizedPostcode = postcode.trim().toUpperCase();

  if (!normalizedPattern || !normalizedPostcode) {
    return false;
  }

  if (normalizedPattern.includes("*")) {
    const expression = new RegExp(`^${normalizedPattern.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*")}$`);
    return expression.test(normalizedPostcode);
  }

  return normalizedPattern === normalizedPostcode;
}

function zoneMatches(locations: WooShippingZoneLocation[], customer: CheckoutCustomer) {
  if (locations.length === 0) {
    return true;
  }

  if (
    locations.some((location) => {
      const code = String(location.code ?? "").toLowerCase();
      const type = String(location.type ?? "").toLowerCase();

      return (
        code === "*" ||
        code === "all" ||
        code === "everywhere" ||
        type === "everywhere" ||
        type === "all"
      );
    })
  ) {
    return true;
  }

  const country = normalizeCountry(customer.country || "IN");
  const state = normalizeState(customer.state);
  const postcode = customer.pincode.trim();

  return locations.some((location) => {
    const code = String(location.code ?? "").toUpperCase();

    if (location.type === "country") {
      return code === country;
    }

    if (location.type === "state") {
      return code === `${country}:${state}` || code.endsWith(`:${state}`);
    }

    if (location.type === "postcode") {
      return postcodeMatches(code, postcode);
    }

    return false;
  });
}

function getSetting(method: WooShippingMethod, key: string) {
  return method.settings?.[key]?.value;
}

function methodIsEnabled(method: WooShippingMethod) {
  return method.enabled !== false && method.enabled !== "no";
}

function mapMethodToOption(method: WooShippingMethod, subtotal: number): CheckoutShippingOption | null {
  if (!methodIsEnabled(method) || !method.method_id) {
    return null;
  }

  const methodId = method.method_id;
  const instanceId = method.instance_id;
  const title = String(getSetting(method, "title") || method.title || method.method_title || "Shipping");
  let total = 0;

  if (methodId === "free_shipping") {
    const requires = String(getSetting(method, "requires") ?? "");
    const minimum = readAmount(getSetting(method, "min_amount"));

    if (requires.includes("min_amount") && subtotal < minimum) {
      return null;
    }
  } else {
    total = readAmount(getSetting(method, "cost"));
  }

  return {
    id: `${methodId}:${instanceId ?? 0}`,
    methodId,
    instanceId,
    title,
    total
  };
}

async function getZoneShippingOptions(zoneId: number, subtotal: number) {
  const methods = await getWooJson<WooShippingMethod[]>(`/wp-json/wc/v3/shipping/zones/${zoneId}/methods`);
  const refreshedMethods = await Promise.all(
    methods.map(async (method) => {
      if (method.instance_id === undefined) {
        return method;
      }

      // The collection endpoint can return stale settings; the instance endpoint is authoritative.
      return (
        await getOptionalWooJson<WooShippingMethod>(
          `/wp-json/wc/v3/shipping/zones/${zoneId}/methods/${method.instance_id}`
        )
      ) ?? method;
    })
  );

  return refreshedMethods
    .map((method) => mapMethodToOption(method, subtotal))
    .filter((option): option is CheckoutShippingOption => Boolean(option))
    .sort((first, second) => first.total - second.total);
}

async function getShippingZones() {
  const zones = await getWooJson<WooShippingZone[]>("/wp-json/wc/v3/shipping/zones");
  const byId = new Map<number, WooShippingZone>();

  zones.forEach((zone) => byId.set(zone.id, zone));

  if (zones.length <= 1 && zones.every((zone) => zone.id === 0)) {
    for (let id = 1; id <= 20; id += 1) {
      const zone = await getOptionalWooJson<WooShippingZone>(`/wp-json/wc/v3/shipping/zones/${id}`);

      if (zone?.id !== undefined) {
        byId.set(zone.id, zone);
      }
    }
  }

  return Array.from(byId.values()).sort((first, second) => first.id - second.id);
}

export async function getCheckoutShippingOptions(
  items: CheckoutOrderItem[],
  customer: CheckoutCustomer,
  discountCode?: string
) {
  const pricing = await calculateDiscountedCheckoutAmountPaise(items, discountCode);
  const zones = await getShippingZones();
  const specificZones = zones.filter((zone) => zone.id !== 0);
  const fallbackZone = zones.find((zone) => zone.id === 0) ?? { id: 0, name: "Everywhere" };
  const allOptions: CheckoutShippingOption[] = [];

  for (const zone of specificZones) {
    const locations = await getWooJson<WooShippingZoneLocation[]>(`/wp-json/wc/v3/shipping/zones/${zone.id}/locations`);

    if (!zoneMatches(locations, customer)) {
      continue;
    }

    const options = await getZoneShippingOptions(zone.id, pricing.total);
    allOptions.push(...options);

    if (options.length > 0) {
      return options;
    }
  }

  const fallbackLocations = fallbackZone.id === 0
    ? []
    : await getWooJson<WooShippingZoneLocation[]>(`/wp-json/wc/v3/shipping/zones/${fallbackZone.id}/locations`);

  if (zoneMatches(fallbackLocations, customer)) {
    const options = await getZoneShippingOptions(fallbackZone.id, pricing.total);
    allOptions.push(...options);

    if (options.length > 0) {
      return options;
    }
  }

  return allOptions
    .filter((option, index, options) => options.findIndex((item) => item.id === option.id) === index)
    .sort((first, second) => first.total - second.total);
}

export async function getCheckoutShippingOption(
  items: CheckoutOrderItem[],
  customer: CheckoutCustomer,
  shippingId?: string,
  discountCode?: string
) {
  const options = await getCheckoutShippingOptions(items, customer, discountCode);
  const selected = options.find((option) => option.id === shippingId) ?? options[0];

  if (!selected) {
    throw new Error("No WooCommerce shipping method is available for this address.");
  }

  return selected;
}
