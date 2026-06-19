import { NextResponse } from "next/server";
import { getCheckoutShippingOptions } from "@/lib/checkout-shipping";
import type { CheckoutCustomer, CheckoutOrderItem } from "@/lib/checkout-orders";

type ShippingBody = {
  items?: CheckoutOrderItem[];
  customer?: CheckoutCustomer;
  discountCode?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ShippingBody;
    const items = Array.isArray(body.items) ? body.items : [];

    if (items.length === 0 || !body.customer) {
      return NextResponse.json({ error: "Missing cart or shipping address." }, { status: 400 });
    }

    const options = await getCheckoutShippingOptions(items, body.customer, body.discountCode);

    if (options.length === 0) {
      return NextResponse.json(
        { error: "No enabled WooCommerce shipping method was found for this address." },
        { status: 404 }
      );
    }

    return NextResponse.json({ options });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not load shipping methods." },
      { status: 400 }
    );
  }
}
