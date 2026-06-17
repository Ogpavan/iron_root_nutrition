import { NextResponse } from "next/server";
import {
  createWooCommerceCheckoutOrder,
  type CheckoutCustomer,
  type CheckoutOrderItem
} from "@/lib/checkout-orders";

type CreateOrderBody = {
  items?: CheckoutOrderItem[];
  customer?: CheckoutCustomer;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateOrderBody;

    if (!Array.isArray(body.items) || !body.customer) {
      return NextResponse.json({ error: "Missing order details." }, { status: 400 });
    }

    const order = await createWooCommerceCheckoutOrder({
      items: body.items,
      customer: body.customer,
      paymentMethod: "cod"
    });

    return NextResponse.json({ order });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not create WooCommerce order." },
      { status: 500 }
    );
  }
}
