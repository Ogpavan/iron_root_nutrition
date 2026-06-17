import { NextResponse } from "next/server";

type AccountOrdersBody = {
  email?: string;
  phone?: string;
};

type WooOrderLineItem = {
  id?: number;
  product_id?: number;
  name?: string;
  quantity?: number;
  total?: string;
  image?: {
    src?: string;
  };
};

type WooOrder = {
  id?: number;
  number?: string;
  status?: string;
  date_created?: string;
  total?: string;
  currency?: string;
  payment_method_title?: string;
  billing?: {
    email?: string;
    phone?: string;
  };
  line_items?: WooOrderLineItem[];
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

function normalizeEmail(value?: string) {
  return value?.trim().toLowerCase() ?? "";
}

function normalizePhone(value?: string) {
  return value?.replace(/\D/g, "") ?? "";
}

function formatCurrency(value?: string, currency = "INR") {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return value || "";
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2
  }).format(amount);
}

function statusLabel(value?: string) {
  return (value || "processing")
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function matchesCustomer(order: WooOrder, email: string, phone: string) {
  const orderEmail = normalizeEmail(order.billing?.email);
  const orderPhone = normalizePhone(order.billing?.phone);

  return Boolean(
    (email && orderEmail === email) ||
    (phone && orderPhone && (orderPhone.endsWith(phone) || phone.endsWith(orderPhone)))
  );
}

async function fetchWooOrders(search: string) {
  const { siteUrl, consumerKey, consumerSecret } = getWooCredentials();
  const endpoint = new URL("/wp-json/wc/v3/orders", siteUrl);
  endpoint.searchParams.set("search", search);
  endpoint.searchParams.set("per_page", "20");
  endpoint.searchParams.set("orderby", "date");
  endpoint.searchParams.set("order", "desc");

  const response = await fetch(endpoint, {
    headers: {
      Accept: "application/json",
      Authorization: `Basic ${Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64")}`
    },
    cache: "no-store"
  });
  const data: unknown = await response.json();

  if (!response.ok) {
    const message = typeof data === "object" && data && "message" in data
      ? String((data as { message?: unknown }).message)
      : "Could not fetch orders.";
    throw new Error(message);
  }

  return Array.isArray(data) ? data as WooOrder[] : [];
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as AccountOrdersBody;
    const email = normalizeEmail(body.email);
    const phone = normalizePhone(body.phone);
    const searches = Array.from(new Set([email, phone].filter(Boolean)));

    if (searches.length === 0) {
      return NextResponse.json({ orders: [] });
    }

    const results = await Promise.all(searches.map(fetchWooOrders));
    const byId = new Map<number, WooOrder>();

    results
      .flat()
      .filter((order) => typeof order.id === "number" && matchesCustomer(order, email, phone))
      .forEach((order) => {
        byId.set(order.id as number, order);
      });

    const orders = Array.from(byId.values()).map((order) => ({
      id: order.id,
      number: order.number || String(order.id),
      status: order.status || "processing",
      statusLabel: statusLabel(order.status),
      dateCreated: order.date_created,
      total: formatCurrency(order.total, order.currency),
      paymentMethod: order.payment_method_title || "Payment",
      items: (order.line_items ?? []).map((item) => ({
        id: item.id,
        productId: item.product_id,
        name: item.name || "Product",
        quantity: item.quantity ?? 1,
        total: formatCurrency(item.total, order.currency),
        image: item.image?.src
      }))
    }));

    return NextResponse.json({ orders });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not load order history." },
      { status: 500 }
    );
  }
}
