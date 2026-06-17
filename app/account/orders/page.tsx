import type { Metadata } from "next";
import AccountOrdersPage from "@/components/AccountOrdersPage";
import { getWooCategories } from "@/lib/woocommerce";

export const metadata: Metadata = {
  title: "Previous Orders",
  description: "View your previous IronRoot Nutrition orders.",
  alternates: {
    canonical: "/account/orders"
  }
};

export default async function Page() {
  const categories = await getWooCategories();

  return <AccountOrdersPage categories={categories} />;
}
