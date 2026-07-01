import type { Metadata } from "next";
import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Clear Cache",
  robots: {
    index: false,
    follow: false
  }
};

type ClearCachePageProps = {
  searchParams?: Promise<{
    cleared?: string | string[];
    error?: string | string[];
    secret?: string | string[];
  }>;
};

const cachedTags = ["woocommerce-categories", "woocommerce-product-reviews"];

function firstParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

async function clearCache(formData: FormData) {
  "use server";

  const configuredSecret = process.env.CACHE_CLEAR_SECRET;
  const providedSecret = String(formData.get("secret") ?? "");

  if (configuredSecret && providedSecret !== configuredSecret) {
    redirect("/clear-cache?error=invalid-secret");
  }

  cachedTags.forEach((tag) => revalidateTag(tag, "max"));
  revalidatePath("/", "layout");

  const secretQuery = configuredSecret ? `secret=${encodeURIComponent(providedSecret)}&` : "";
  redirect(`/clear-cache?${secretQuery}cleared=1`);
}

export default async function ClearCachePage({ searchParams }: ClearCachePageProps) {
  const params = await searchParams;
  const configuredSecret = process.env.CACHE_CLEAR_SECRET;
  const providedSecret = firstParam(params?.secret) ?? "";
  const isAllowed = !configuredSecret || providedSecret === configuredSecret;
  const cleared = firstParam(params?.cleared) === "1";
  const hasInvalidSecret = firstParam(params?.error) === "invalid-secret";

  return (
    <main className="clear-cache-page">
      <section className="clear-cache-panel">
        <p className="clear-cache-kicker">Storefront utility</p>
        <h1>Clear site cache</h1>
        <p>
          Purge cached WooCommerce categories, product reviews, and revalidate the Next.js
          storefront routes.
        </p>

        {cleared ? (
          <div className="clear-cache-status success" role="status">
            Cache cleared successfully.
          </div>
        ) : null}

        {hasInvalidSecret ? (
          <div className="clear-cache-status error" role="alert">
            Invalid cache clear secret.
          </div>
        ) : null}

        {isAllowed ? (
          <form action={clearCache}>
            <input type="hidden" name="secret" value={providedSecret} />
            <button className="clear-cache-button" type="submit">
              Clear all cache
            </button>
          </form>
        ) : (
          <div className="clear-cache-status error" role="alert">
            Add the correct <code>?secret=...</code> value to use this route.
          </div>
        )}

        {!configuredSecret ? (
          <p className="clear-cache-note">
            Set <code>CACHE_CLEAR_SECRET</code> in production to protect this route.
          </p>
        ) : null}
      </section>
    </main>
  );
}
