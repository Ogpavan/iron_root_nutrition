import { NextResponse } from "next/server";
import { getAllProducts } from "@/lib/woocommerce";

const maxLimit = 48;

function normalize(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function matchesQuery(product: Awaited<ReturnType<typeof getAllProducts>>[number], query: string) {
  const terms = normalize(query).split(" ").filter(Boolean);

  if (terms.length === 0) {
    return true;
  }

  const haystack = normalize(
    [
      product.name,
      product.tag,
      product.price,
      product.sku,
      product.slug,
      product.shortDescription,
      product.description
    ]
      .filter(Boolean)
      .join(" ")
  );

  return terms.every((term) => haystack.includes(term));
}

function readLimit(value: string | null) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 8;
  }

  return Math.min(Math.floor(parsed), maxLimit);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query") ?? searchParams.get("q") ?? "";
  const limit = readLimit(searchParams.get("limit"));
  const products = await getAllProducts(maxLimit);
  const results = products.filter((product) => matchesQuery(product, query)).slice(0, limit);

  return NextResponse.json(
    {
      products: results.map((product) => ({
        id: product.id,
        slug: product.slug,
        name: product.name,
        tag: product.tag,
        price: product.price,
        image: product.image,
        href: product.href
      }))
    },
    {
      headers: {
        "Cache-Control": "no-store"
      }
    }
  );
}
