import { NextResponse } from "next/server";
import { matchesProductSearch, sortProductsBySearchRelevance } from "@/lib/product-search";
import { getAllProducts } from "@/lib/woocommerce";

const maxLimit = 48;

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
  const matchedResults = sortProductsBySearchRelevance(
    products.filter((product) => matchesProductSearch(product, query)),
    query
  );
  const results =
    matchedResults.length > 0 || query.trim().length === 0
      ? matchedResults.slice(0, limit)
      : products.slice(0, limit);

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
