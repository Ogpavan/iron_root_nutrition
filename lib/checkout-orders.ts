import { getAllProducts } from "@/lib/woocommerce";
import { calculateDiscountedCheckoutAmountPaise } from "@/lib/checkout-discounts";
import type { CheckoutShippingOption } from "@/lib/checkout-shipping";

export type CheckoutOrderItem = {
  id?: number | string;
  variationId?: number | string;
  variationAttributes?: {
    name?: string;
    option?: string;
  }[];
  href?: string;
  name?: string;
  quantity?: number;
};

export type CheckoutCustomer = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  country: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  pincode: string;
};

type CreateWooOrderInput = {
  items: CheckoutOrderItem[];
  customer: CheckoutCustomer;
  paymentMethod: "cod" | "razorpay";
  discountCode?: string;
  shipping?: CheckoutShippingOption;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
};

type WooOrderResponse = {
  id?: number;
  number?: string;
  status?: string;
  message?: string;
};

function getQuantity(value: unknown) {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(1, Math.min(99, Math.floor(value)))
    : 1;
}

function getWooCredentials() {
  const siteUrl = process.env.WORDPRESS_SITE_URL;
  const consumerKey = process.env.WOOCOMMERCE_CONSUMER_KEY;
  const consumerSecret = process.env.WOOCOMMERCE_CONSUMER_SECRET;

  if (!siteUrl || !consumerKey || !consumerSecret) {
    throw new Error("WooCommerce credentials are not configured.");
  }

  return { siteUrl, consumerKey, consumerSecret };
}

function normalizeCountry(value: string) {
  return value.trim().toLowerCase() === "india" ? "IN" : value.trim().toUpperCase();
}

function getEmail(customer: CheckoutCustomer) {
  return customer.email.trim().toLowerCase();
}

function getPhone(customer: CheckoutCustomer) {
  return customer.phone.trim();
}

function readPrice(value: string) {
  const parsed = Number(value.replace(/[^0-9.]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function calculateCheckoutAmountPaise(items: CheckoutOrderItem[]) {
  return calculateCheckoutAmountWithDiscountPaise(items);
}

export async function calculateCheckoutAmountWithDiscountPaise(
  items: CheckoutOrderItem[],
  discountCode?: string
) {
  const { amountPaise } = await calculateDiscountedCheckoutAmountPaise(items, discountCode);

  return amountPaise;
}

export async function createWooCommerceCheckoutOrder({
  items,
  customer,
  paymentMethod,
  discountCode,
  shipping,
  razorpayOrderId,
  razorpayPaymentId
}: CreateWooOrderInput) {
  if (items.length === 0) {
    throw new Error("Cart is empty.");
  }

  const { siteUrl, consumerKey, consumerSecret } = getWooCredentials();
  const products = await getAllProducts(100, { includeVariations: true });
  const lineItems = items.map((item) => {
    const product = products.find((candidate) => {
      return (
        (item.id !== undefined && String(candidate.id) === String(item.id)) ||
        (item.variationId !== undefined &&
          candidate.variations?.some((variation) => String(variation.id) === String(item.variationId))) ||
        (item.href && candidate.href === item.href) ||
        (item.name && candidate.name === item.name)
      );
    });

    const productId = typeof product?.id === "number" ? product.id : Number(product?.id);
    const variation = item.variationId !== undefined
      ? product?.variations?.find((candidate) => String(candidate.id) === String(item.variationId))
      : undefined;

    if (!product || !Number.isFinite(productId)) {
      throw new Error(`Could not validate cart item: ${item.name ?? "Unknown product"}.`);
    }

    if (item.variationId !== undefined && !variation) {
      throw new Error(`Could not validate selected variation for ${item.name ?? product.name}.`);
    }

    const quantity = getQuantity(item.quantity);
    const unitPrice = readPrice(variation?.price ?? product.price);
    const lineTotal = (unitPrice * quantity).toFixed(2);

    return {
      product_id: productId,
      variation_id: variation?.id,
      quantity,
      subtotal: lineTotal,
      total: lineTotal
    };
  });
  const country = normalizeCountry(customer.country || "IN");
  const email = getEmail(customer);

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("A valid email address is required to place an order.");
  }

  const billing = {
    first_name: customer.firstName.trim(),
    last_name: customer.lastName.trim(),
    address_1: customer.address1.trim(),
    address_2: customer.address2.trim(),
    city: customer.city.trim(),
    state: customer.state.trim(),
    postcode: customer.pincode.trim(),
    country,
    email,
    phone: getPhone(customer)
  };
  const isRazorpay = paymentMethod === "razorpay";
  const payload = {
    payment_method: isRazorpay ? "razorpay" : "cod",
    payment_method_title: isRazorpay ? "Razorpay" : "Cash on delivery",
    set_paid: isRazorpay,
    status: "processing",
    transaction_id: razorpayPaymentId,
    billing,
    shipping: billing,
    line_items: lineItems,
    shipping_lines: shipping
      ? [{
          method_id: shipping.methodId,
          method_title: shipping.title,
          total: shipping.total.toFixed(2)
        }]
      : undefined,
    coupon_lines: discountCode ? [{ code: discountCode.trim() }] : undefined,
    meta_data: [
      ...(discountCode ? [{ key: "_ironroot_discount_code", value: discountCode.trim() }] : []),
      ...(razorpayOrderId ? [{ key: "_razorpay_order_id", value: razorpayOrderId }] : []),
      ...(razorpayPaymentId ? [{ key: "_razorpay_payment_id", value: razorpayPaymentId }] : [])
    ]
  };
  const endpoint = new URL("/wp-json/wc/v3/orders", siteUrl);
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: `Basic ${Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64")}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
  const data = (await response.json()) as WooOrderResponse;

  if (!response.ok || !data.id) {
    throw new Error(data.message || "Could not create WooCommerce order.");
  }

  return {
    id: data.id,
    number: data.number,
    status: data.status
  };
}
