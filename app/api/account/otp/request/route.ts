import { NextResponse } from "next/server";
import { isValidAuthEmail, normalizeAuthEmail } from "@/lib/account-auth";
import { isRazorpayReviewEmail, razorpayReviewOtp } from "@/lib/account-review-auth";
import { createAccountOtpChallenge, sendSignupOtpEmail } from "@/lib/account-otp";

type AccountOtpRequestBody = {
  name?: string;
  email?: string;
  identifier?: string;
};

export const runtime = "nodejs";

function cleanString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as AccountOtpRequestBody;
    const name = cleanString(body.name);
    const email = normalizeAuthEmail(cleanString(body.email || body.identifier));

    if (name.length < 2) {
      return NextResponse.json({ error: "Enter your name to continue." }, { status: 400 });
    }

    if (!isValidAuthEmail(email)) {
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    }

    const isReviewAccount = isRazorpayReviewEmail(email);
    const challenge = createAccountOtpChallenge(
      name,
      email,
      isReviewAccount ? { otp: razorpayReviewOtp } : undefined
    );

    if (isReviewAccount) {
      return NextResponse.json({
        token: challenge.token,
        expiresAt: challenge.expiresAt,
        message: `Use OTP ${razorpayReviewOtp} to continue.`
      });
    }

    await sendSignupOtpEmail({
      to: email,
      name,
      otp: challenge.otp
    });

    return NextResponse.json({
      token: challenge.token,
      expiresAt: challenge.expiresAt,
      message: "OTP sent to your email address."
    });
  } catch (error) {
    console.error("Account OTP request failed", error);

    return NextResponse.json(
      { error: "Could not send OTP. Please try again." },
      { status: 500 }
    );
  }
}
