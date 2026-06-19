import type { Metadata } from "next";
import AccountAddressPage from "@/components/AccountAddressPage";
import { getWooCategories } from "@/lib/woocommerce";

export const metadata: Metadata = {
  title: "Saved Address",
  description: "Manage your saved IronRoot billing and shipping address.",
  alternates: {
    canonical: "/account/address"
  }
};

export default async function Page() {
  const categories = await getWooCategories();

  return <AccountAddressPage categories={categories} />;
}
