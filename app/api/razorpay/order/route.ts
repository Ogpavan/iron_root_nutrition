import { NextResponse } from "next/server";
import { getAllProducts } from "@/lib/woocommerce";

type CheckoutItem = {
  id?: number | string;
  href?: string;
  name?: string;
  quantity?: number;
};

function readPrice(value: string) {
  const parsed = Number(value.replace(/[^0-9.]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function getRazorpayCredentials() {
  const keyId = process.env.RAZORPAY_KEY_ID ?? process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error("Razorpay credentials are not configured.");
  }

  return { keyId, keySecret };
}

function getQuantity(value: unknown) {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(1, Math.min(99, Math.floor(value)))
    : 1;
}

export async function POST(request: Request) {
  try {
    const { keyId, keySecret } = getRazorpayCredentials();
    const body = (await request.json()) as { items?: CheckoutItem[] };
    const items = Array.isArray(body.items) ? body.items : [];

    if (items.length === 0) {
      return NextResponse.json({ error: "Cart is empty." }, { status: 400 });
    }

    const products = await getAllProducts(100);
    let subtotal = 0;

    for (const item of items) {
      const product = products.find((candidate) => {
        return (
          (item.id !== undefined && String(candidate.id) === String(item.id)) ||
          (item.href && candidate.href === item.href) ||
          (item.name && candidate.name === item.name)
        );
      });

      if (!product) {
        return NextResponse.json(
          { error: `Could not validate cart item: ${item.name ?? "Unknown product"}.` },
          { status: 400 }
        );
      }

      subtotal += readPrice(product.price) * getQuantity(item.quantity);
    }

    const amount = Math.round(subtotal * 100);

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
          item_count: String(items.length)
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
      currency: data.currency ?? "INR"
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not create Razorpay order." },
      { status: 500 }
    );
  }
}
