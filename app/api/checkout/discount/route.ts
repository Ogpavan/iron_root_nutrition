import { NextResponse } from "next/server";
import { calculateDiscountedCheckoutAmountPaise } from "@/lib/checkout-discounts";
import type { CheckoutOrderItem } from "@/lib/checkout-orders";

type DiscountBody = {
  items?: CheckoutOrderItem[];
  discountCode?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as DiscountBody;
    const items = Array.isArray(body.items) ? body.items : [];

    if (!body.discountCode?.trim()) {
      return NextResponse.json({ error: "Enter a discount code." }, { status: 400 });
    }

    const result = await calculateDiscountedCheckoutAmountPaise(items, body.discountCode);

    if (!result.discount || result.discount.amount <= 0) {
      return NextResponse.json({ error: "Discount code is not valid for this cart." }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not apply discount." },
      { status: 400 }
    );
  }
}
