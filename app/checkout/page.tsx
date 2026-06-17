import type { Metadata } from "next";
import CheckoutPage from "@/components/CheckoutPage";
import { getWooCategories } from "@/lib/woocommerce";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Complete your IronRoot Nutrition order.",
  alternates: {
    canonical: "/checkout"
  }
};

export default async function Page() {
  const categories = await getWooCategories();

  return <CheckoutPage categories={categories} />;
}
