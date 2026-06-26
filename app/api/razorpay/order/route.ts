import { NextResponse } from "next/server";
import { calculateDiscountedCheckoutAmountPaise } from "@/lib/checkout-discounts";
import { getCheckoutShippingOption } from "@/lib/checkout-shipping";
import type { CheckoutCustomer } from "@/lib/checkout-orders";

type CheckoutItem = {
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

function getRazorpayCredentials() {
  const keyId = process.env.RAZORPAY_KEY_ID ?? process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error("Razorpay credentials are not configured.");
  }

  return { keyId, keySecret };
}

export async function POST(request: Request) {
  try {
    const { keyId, keySecret } = getRazorpayCredentials();
    const body = (await request.json()) as {
      items?: CheckoutItem[];
      customer?: CheckoutCustomer;
      discountCode?: string;
      shippingId?: string;
    };
    const items = Array.isArray(body.items) ? body.items : [];

    if (items.length === 0) {
      return NextResponse.json({ error: "Cart is empty." }, { status: 400 });
    }

    const pricing = await calculateDiscountedCheckoutAmountPaise(
      items,
      body.discountCode
    );
    const shipping = body.customer
      ? await getCheckoutShippingOption(items, body.customer, body.shippingId, body.discountCode)
      : null;
    const amount = pricing.amountPaise + Math.round((shipping?.total ?? 0) * 100);

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: "Invalid order amount." }, { status: 400 });
    }

    const receipt = `ironroot_${Date.now()}`.slice(0, 40);
    const response = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        amount,
        currency: "INR",
        receipt,
        notes: {
          item_count: String(items.length),
          discount_code: pricing.discount?.code ?? "",
          shipping_method: shipping?.title ?? ""
        }
      })
    });

    const data = (await response.json()) as { id?: string; amount?: number; currency?: string; error?: unknown };

    if (!response.ok || !data.id) {
      return NextResponse.json(
        { error: "Could not create Razorpay order.", details: data.error },
        { status: response.status || 502 }
      );
    }

    return NextResponse.json({
      keyId,
      orderId: data.id,
      amount: data.amount,
      currency: data.currency ?? "INR",
      discount: pricing.discount,
      shipping
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not create Razorpay order." },
      { status: 500 }
    );
  }
}
