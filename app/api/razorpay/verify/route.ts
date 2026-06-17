import crypto from "crypto";
import { NextResponse } from "next/server";
import {
  calculateCheckoutAmountPaise,
  createWooCommerceCheckoutOrder,
  type CheckoutCustomer,
  type CheckoutOrderItem
} from "@/lib/checkout-orders";

type VerifyPaymentBody = {
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
  checkout?: {
    items?: CheckoutOrderItem[];
    customer?: CheckoutCustomer;
  };
};

function timingSafeEqual(first: string, second: string) {
  const firstBuffer = Buffer.from(first);
  const secondBuffer = Buffer.from(second);

  return firstBuffer.length === secondBuffer.length && crypto.timingSafeEqual(firstBuffer, secondBuffer);
}

export async function POST(request: Request) {
  try {
    const keyId = process.env.RAZORPAY_KEY_ID ?? process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      return NextResponse.json({ error: "Razorpay credentials are not configured." }, { status: 500 });
    }

    const body = (await request.json()) as VerifyPaymentBody;
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ error: "Missing Razorpay payment verification data." }, { status: 400 });
    }

    const expectedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (!timingSafeEqual(expectedSignature, razorpay_signature)) {
      return NextResponse.json({ verified: false, error: "Payment signature verification failed." }, { status: 400 });
    }

    if (!Array.isArray(body.checkout?.items) || !body.checkout?.customer) {
      return NextResponse.json({ verified: true, error: "Missing WooCommerce order details." }, { status: 400 });
    }

    const [expectedAmount, razorpayOrderResponse] = await Promise.all([
      calculateCheckoutAmountPaise(body.checkout.items),
      fetch(`https://api.razorpay.com/v1/orders/${razorpay_order_id}`, {
        headers: {
          Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`
        }
      })
    ]);
    const razorpayOrder = (await razorpayOrderResponse.json()) as { amount?: number };

    if (!razorpayOrderResponse.ok || razorpayOrder.amount !== expectedAmount) {
      return NextResponse.json({ verified: false, error: "Paid amount does not match cart total." }, { status: 400 });
    }

    const order = await createWooCommerceCheckoutOrder({
      items: body.checkout.items,
      customer: body.checkout.customer,
      paymentMethod: "razorpay",
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id
    });

    return NextResponse.json({ verified: true, order });
  } catch (error) {
    return NextResponse.json(
      { verified: false, error: error instanceof Error ? error.message : "Could not verify payment." },
      { status: 500 }
    );
  }
}
