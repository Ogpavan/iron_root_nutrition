import { getAllProducts } from "@/lib/woocommerce";

export type CheckoutOrderItem = {
  id?: number | string;
  href?: string;
  name?: string;
  quantity?: number;
};

export type CheckoutCustomer = {
  firstName: string;
  lastName: string;
  emailOrPhone: string;
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
  return customer.emailOrPhone.includes("@") ? customer.emailOrPhone.trim() : "";
}

function getPhone(customer: CheckoutCustomer) {
  return customer.phone.trim() || (!customer.emailOrPhone.includes("@") ? customer.emailOrPhone.trim() : "");
}

function readPrice(value: string) {
  const parsed = Number(value.replace(/[^0-9.]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function calculateCheckoutAmountPaise(items: CheckoutOrderItem[]) {
  if (items.length === 0) {
    throw new Error("Cart is empty.");
  }

  const products = await getAllProducts(100);
  const subtotal = items.reduce((total, item) => {
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

  return Math.round(subtotal * 100);
}

export async function createWooCommerceCheckoutOrder({
  items,
  customer,
  paymentMethod,
  razorpayOrderId,
  razorpayPaymentId
}: CreateWooOrderInput) {
  if (items.length === 0) {
    throw new Error("Cart is empty.");
  }

  const { siteUrl, consumerKey, consumerSecret } = getWooCredentials();
  const products = await getAllProducts(100);
  const lineItems = items.map((item) => {
    const product = products.find((candidate) => {
      return (
        (item.id !== undefined && String(candidate.id) === String(item.id)) ||
        (item.href && candidate.href === item.href) ||
        (item.name && candidate.name === item.name)
      );
    });

    const productId = typeof product?.id === "number" ? product.id : Number(product?.id);

    if (!product || !Number.isFinite(productId)) {
      throw new Error(`Could not validate cart item: ${item.name ?? "Unknown product"}.`);
    }

    return {
      product_id: productId,
      quantity: getQuantity(item.quantity)
    };
  });
  const country = normalizeCountry(customer.country || "IN");
  const billing = {
    first_name: customer.firstName.trim(),
    last_name: customer.lastName.trim(),
    address_1: customer.address1.trim(),
    address_2: customer.address2.trim(),
    city: customer.city.trim(),
    state: customer.state.trim(),
    postcode: customer.pincode.trim(),
    country,
    email: getEmail(customer),
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
    meta_data: [
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
