import { normalizeAuthEmail } from "@/lib/account-auth";

export const razorpayReviewEmail = "razorpay.review@ironrootnutrition.com";
export const razorpayReviewOtp = "123456";

export function isRazorpayReviewEmail(value: string) {
  return normalizeAuthEmail(value) === razorpayReviewEmail;
}
