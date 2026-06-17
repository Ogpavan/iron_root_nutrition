import type { Metadata } from "next";
import AccountOtpPage from "@/components/AccountOtpPage";
import { getWooCategories } from "@/lib/woocommerce";

export const metadata: Metadata = {
  title: "Login / Sign up",
  description: "Login or sign up to IronRoot with OTP verification.",
  alternates: {
    canonical: "/account"
  }
};

export default async function Page() {
  const categories = await getWooCategories();

  return <AccountOtpPage categories={categories} />;
}
