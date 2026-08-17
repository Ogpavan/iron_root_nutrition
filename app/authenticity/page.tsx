import type { Metadata } from "next";
import AuthenticityPage from "@/components/AuthenticityPage";
import { getWooCategories } from "@/lib/woocommerce";

export const metadata: Metadata = {
  title: "Authenticity",
  description: "Verify your IronRoot Nutrition product with the barcode printed on the pack.",
  alternates: {
    canonical: "/authenticity"
  }
};

export default async function Page() {
  const categories = await getWooCategories();

  return <AuthenticityPage categories={categories} />;
}
