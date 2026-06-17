import { NextResponse } from "next/server";
import { getAllProducts } from "@/lib/woocommerce";

type CartRefreshItem = {
  id?: number | string;
  key?: string;
  href?: string;
  name?: string;
  quantity?: number;
};

function getQuantity(value: unknown) {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(1, Math.min(99, Math.floor(value)))
    : 1;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { items?: CartRefreshItem[] };
    const items = Array.isArray(body.items) ? body.items : [];

    if (items.length === 0) {
      return NextResponse.json({ items: [] });
    }

    const products = await getAllProducts(100);
    const refreshedItems = items
      .map((item) => {
        const product = products.find((candidate) => {
          return (
            (item.id !== undefined && String(candidate.id) === String(item.id)) ||
            (item.href && candidate.href === item.href) ||
            (item.name && candidate.name === item.name)
          );
        });

        if (!product) {
          return null;
        }

        return {
          id: product.id,
          key: item.key || String(product.id ?? product.href ?? product.name),
          name: product.name,
          price: product.price,
          image: product.image,
          tag: product.tag,
          href: product.href,
          quantity: getQuantity(item.quantity)
        };
      })
      .filter(Boolean);

    return NextResponse.json({ items: refreshedItems });
  } catch {
    return NextResponse.json({ error: "Could not refresh cart prices." }, { status: 500 });
  }
}
