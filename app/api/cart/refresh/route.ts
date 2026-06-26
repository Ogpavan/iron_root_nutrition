import { NextResponse } from "next/server";
import { getAllProducts } from "@/lib/woocommerce";

type CartRefreshVariationAttribute = {
  name?: string;
  option?: string;
};

type CartRefreshItem = {
  id?: number | string;
  variationId?: number | string;
  variationAttributes?: CartRefreshVariationAttribute[];
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

    const products = await getAllProducts(100, { includeVariations: true });
    const refreshedItems = items
      .map((item) => {
        const product = products.find((candidate) => {
          return (
            (item.id !== undefined && String(candidate.id) === String(item.id)) ||
            (item.variationId !== undefined &&
              candidate.variations?.some((variation) => String(variation.id) === String(item.variationId))) ||
            (item.href && candidate.href === item.href) ||
            (item.name && candidate.name === item.name)
          );
        });

        if (!product) {
          return null;
        }

        const variation = item.variationId !== undefined
          ? product.variations?.find((candidate) => String(candidate.id) === String(item.variationId))
          : undefined;
        const variationAttributes = variation?.attributes ?? item.variationAttributes;
        const variationSuffix = variationAttributes
          ?.map((attribute) => attribute.option)
          .filter(Boolean)
          .join(" / ");

        return {
          id: product.id,
          variationId: variation?.id ?? item.variationId,
          variationAttributes,
          key: item.key || String(variation?.id ? `${product.id}:${variation.id}` : product.id ?? product.href ?? product.name),
          name: variationSuffix ? `${product.name} - ${variationSuffix}` : product.name,
          price: variation?.price ?? product.price,
          image: variation?.image ?? product.image,
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
