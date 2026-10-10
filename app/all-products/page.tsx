import { permanentRedirect } from "next/navigation";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LegacyAllProductsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const category = params?.category;
  const categorySlug = Array.isArray(category) ? category[0] : category;
  const query = new URLSearchParams();

  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (key === "category" && categorySlug && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(categorySlug)) {
      return;
    }
    if (Array.isArray(value)) {
      value.forEach((item) => query.append(key, item));
    } else if (value) {
      query.set(key, value);
    }
  });

  const destination = categorySlug && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(categorySlug)
    ? `/supplements/${categorySlug}`
    : "/supplements";
  const suffix = query.size > 0 ? `?${query.toString()}` : "";
  permanentRedirect(`${destination}${suffix}`);
}
