import type { Metadata } from "next";
import LegalPage, { privacyPolicySections } from "@/components/LegalPage";
import { getAllProducts, getWooCategories } from "@/lib/woocommerce";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Read how IronRoot Nutrition collects, uses, shares, protects, and manages customer information.",
  alternates: {
    canonical: "/privacy-policy"
  }
};

export default async function Page() {
  const [products, categories] = await Promise.all([getAllProducts(), getWooCategories()]);

  return (
    <LegalPage
      categories={categories}
      products={products}
      eyebrow="Privacy"
      title="Privacy Policy"
      intro="This policy explains how IronRoot Nutrition handles customer, order, account, support, and website information."
      updatedAt="June 26, 2026"
      sections={privacyPolicySections}
    />
  );
}
