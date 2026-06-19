import { getAllProducts } from "@/lib/woocommerce";
import type { CheckoutOrderItem } from "@/lib/checkout-orders";

type WooCoupon = {
  code?: string;
  discount_type?: "percent" | "fixed_cart" | "fixed_product";
  amount?: string;
  date_expires?: string | null;
  usage_limit?: number | null;
  usage_count?: number;
  minimum_amount?: string;
  maximum_amount?: string;
};

export type CheckoutDiscount = {
  code: string;
  amount: number;
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

function readPrice(value?: string) {
  const parsed = Number(String(value ?? "").replace(/[^0-9.]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function getQuantity(value: unknown) {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(1, Math.min(99, Math.floor(value)))
    : 1;
}

export async function calculateCheckoutSubtotal(items: CheckoutOrderItem[]) {
  if (items.length === 0) {
    throw new Error("Cart is empty.");
  }

  const products = await getAllProducts(100);

  return items.reduce((total, item) => {
    const product = products.find((candidate) => {
      return (
        (item.id !== undefined && String(candidate.id) === String(item.id)) ||
        (item.href && candidate.href === item.href) ||
        (item.name && candidate.name === item.name)
      );
    });

    if (!product) {
      throw new Error(`Could not validate cart item: ${item.name ?? "Unknown product"}.`);
    }

    return total + readPrice(product.price) * getQuantity(item.quantity);
  }, 0);
}

async function getWooCoupon(code: string) {
  const normalizedCode = code.trim().toLowerCase();

  if (!normalizedCode) {
    return null;
  }

  const { siteUrl, consumerKey, consumerSecret } = getWooCredentials();
  const endpoint = new URL("/wp-json/wc/v3/coupons", siteUrl);
  endpoint.searchParams.set("code", normalizedCode);
  endpoint.searchParams.set("per_page", "1");

  const response = await fetch(endpoint, {
    headers: getWooHeaders(consumerKey, consumerSecret),
    cache: "no-store"
  });
  const data = (await response.json().catch(() => null)) as WooCoupon[] | null;

  if (!response.ok || !Array.isArray(data)) {
    throw new Error("Could not validate discount code.");
  }

  return data.find((coupon) => coupon.code?.toLowerCase() === normalizedCode) ?? null;
}

export async function calculateCheckoutDiscount(
  items: CheckoutOrderItem[],
  discountCode?: string
): Promise<CheckoutDiscount | null> {
  const code = discountCode?.trim();

  if (!code) {
    return null;
  }

  const subtotal = await calculateCheckoutSubtotal(items);
  const coupon = await getWooCoupon(code);

  if (!coupon) {
    throw new Error("Discount code was not found.");
  }

  if (coupon.date_expires && new Date(coupon.date_expires).getTime() < Date.now()) {
    throw new Error("Discount code has expired.");
  }

  if (coupon.usage_limit && (coupon.usage_count ?? 0) >= coupon.usage_limit) {
    throw new Error("Discount code has reached its usage limit.");
  }

  const minimumAmount = readPrice(coupon.minimum_amount);
  const maximumAmount = readPrice(coupon.maximum_amount);

  if (minimumAmount > 0 && subtotal < minimumAmount) {
    throw new Error(`Discount code requires a minimum order of Rs. ${minimumAmount}.`);
  }

  if (maximumAmount > 0 && subtotal > maximumAmount) {
    throw new Error(`Discount code is only valid up to Rs. ${maximumAmount}.`);
  }

  const couponAmount = readPrice(coupon.amount);
  let amount = 0;

  if (coupon.discount_type === "percent") {
    amount = subtotal * (couponAmount / 100);
  } else if (coupon.discount_type === "fixed_cart") {
    amount = couponAmount;
  } else {
    throw new Error("This discount type is not supported at checkout.");
  }

  return {
    code: coupon.code ?? code,
    amount: Math.min(subtotal, Math.max(0, Number(amount.toFixed(2))))
  };
}

export async function calculateDiscountedCheckoutAmountPaise(
  items: CheckoutOrderItem[],
  discountCode?: string
) {
  const subtotal = await calculateCheckoutSubtotal(items);
  const discount = await calculateCheckoutDiscount(items, discountCode);

  return {
    subtotal,
    discount,
    total: Math.max(0, subtotal - (discount?.amount ?? 0)),
    amountPaise: Math.round(Math.max(0, subtotal - (discount?.amount ?? 0)) * 100)
  };
}
