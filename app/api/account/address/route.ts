import { NextResponse } from "next/server";

type AccountAddressBody = {
  mode?: "load" | "save";
  email?: string;
  phone?: string;
  name?: string;
  billing?: WooAddress;
  shipping?: WooAddress;
  defaultAddress?: "billing" | "shipping";
};

type WooAddress = {
  first_name?: string;
  last_name?: string;
  company?: string;
  address_1?: string;
  address_2?: string;
  city?: string;
  state?: string;
  postcode?: string;
  country?: string;
  email?: string;
  phone?: string;
};

type WooCustomer = {
  id?: number;
  email?: string;
  first_name?: string;
  last_name?: string;
  billing?: WooAddress;
  shipping?: WooAddress;
  meta_data?: {
    key?: string;
    value?: unknown;
  }[];
};

const defaultAddressMetaKey = "ironroot_default_address";

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
    "Content-Type": "application/json",
    Authorization: `Basic ${Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64")}`
  };
}

function cleanString(value?: string) {
  return value?.trim() ?? "";
}

function normalizeEmail(value?: string) {
  return cleanString(value).toLowerCase();
}

function splitName(value?: string) {
  const parts = cleanString(value).split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return { firstName: "", lastName: "" };
  }

  if (parts.length === 1) {
    return { firstName: parts[0], lastName: "" };
  }

  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

function sanitizeAddress(address?: WooAddress, fallbackEmail = "", fallbackPhone = ""): WooAddress {
  return {
    first_name: cleanString(address?.first_name),
    last_name: cleanString(address?.last_name),
    company: cleanString(address?.company),
    address_1: cleanString(address?.address_1),
    address_2: cleanString(address?.address_2),
    city: cleanString(address?.city),
    state: cleanString(address?.state),
    postcode: cleanString(address?.postcode),
    country: cleanString(address?.country || "IN"),
    email: cleanString(address?.email || fallbackEmail),
    phone: cleanString(address?.phone || fallbackPhone)
  };
}

function getDefaultAddress(customer?: WooCustomer | null): "billing" | "shipping" {
  const stored = customer?.meta_data?.find((item) => item.key === defaultAddressMetaKey)?.value;

  return stored === "shipping" ? "shipping" : "billing";
}

async function parseWooResponse<T>(response: Response, fallbackMessage: string): Promise<T> {
  const data: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const message = typeof data === "object" && data && "message" in data
      ? String((data as { message?: unknown }).message)
      : fallbackMessage;
    throw new Error(message);
  }

  return data as T;
}

async function findCustomerByEmail(email: string) {
  const { siteUrl, consumerKey, consumerSecret } = getWooCredentials();
  const endpoint = new URL("/wp-json/wc/v3/customers", siteUrl);
  endpoint.searchParams.set("email", email);
  endpoint.searchParams.set("per_page", "1");

  const response = await fetch(endpoint, {
    headers: getWooHeaders(consumerKey, consumerSecret),
    cache: "no-store"
  });
  const customers = await parseWooResponse<WooCustomer[]>(response, "Could not load customer.");

  return customers.find((customer) => normalizeEmail(customer.email) === email) ?? null;
}

async function createCustomer(body: AccountAddressBody) {
  const { siteUrl, consumerKey, consumerSecret } = getWooCredentials();
  const endpoint = new URL("/wp-json/wc/v3/customers", siteUrl);
  const email = normalizeEmail(body.email);
  const { firstName, lastName } = splitName(body.name);

  if (!email) {
    throw new Error("Add an email address to your profile before saving a WordPress address.");
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: getWooHeaders(consumerKey, consumerSecret),
    body: JSON.stringify({
      email,
      first_name: firstName,
      last_name: lastName,
      username: email,
      billing: sanitizeAddress(body.billing, email, body.phone),
      shipping: sanitizeAddress(body.shipping, email, body.phone),
      meta_data: [{ key: defaultAddressMetaKey, value: body.defaultAddress ?? "billing" }]
    }),
    cache: "no-store"
  });

  return parseWooResponse<WooCustomer>(response, "Could not create customer.");
}

async function updateCustomer(customerId: number, body: AccountAddressBody) {
  const { siteUrl, consumerKey, consumerSecret } = getWooCredentials();
  const endpoint = new URL(`/wp-json/wc/v3/customers/${customerId}`, siteUrl);
  const email = normalizeEmail(body.email);
  const { firstName, lastName } = splitName(body.name);

  const response = await fetch(endpoint, {
    method: "PUT",
    headers: getWooHeaders(consumerKey, consumerSecret),
    body: JSON.stringify({
      email,
      first_name: firstName,
      last_name: lastName,
      billing: sanitizeAddress(body.billing, email, body.phone),
      shipping: sanitizeAddress(body.shipping, email, body.phone),
      meta_data: [{ key: defaultAddressMetaKey, value: body.defaultAddress ?? "billing" }]
    }),
    cache: "no-store"
  });

  return parseWooResponse<WooCustomer>(response, "Could not update customer address.");
}

function mapCustomer(customer: WooCustomer | null) {
  return {
    customerId: customer?.id ?? null,
    billing: sanitizeAddress(customer?.billing, customer?.email),
    shipping: sanitizeAddress(customer?.shipping, customer?.email),
    defaultAddress: getDefaultAddress(customer)
  };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as AccountAddressBody;
    const email = normalizeEmail(body.email);

    if (!email) {
      return NextResponse.json(
        { error: "Add an email address to your profile before managing WordPress addresses." },
        { status: 400 }
      );
    }

    const existingCustomer = await findCustomerByEmail(email);

    if (body.mode !== "save") {
      return NextResponse.json(mapCustomer(existingCustomer));
    }

    const customer = existingCustomer?.id
      ? await updateCustomer(existingCustomer.id, body)
      : await createCustomer(body);

    return NextResponse.json(mapCustomer(customer));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not manage address." },
      { status: 500 }
    );
  }
}
