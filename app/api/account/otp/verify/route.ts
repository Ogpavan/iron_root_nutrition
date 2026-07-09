import { NextResponse } from "next/server";
import { verifyAccountOtpChallenge } from "@/lib/account-otp";

type AccountOtpVerifyBody = {
  token?: string;
  otp?: string;
};

export const runtime = "nodejs";

function cleanString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as AccountOtpVerifyBody;
    const token = cleanString(body.token);
    const otp = cleanString(body.otp);

    if (!token) {
      return NextResponse.json({ error: "Request a new OTP to continue." }, { status: 400 });
    }

    const user = verifyAccountOtpChallenge(token, otp);

    return NextResponse.json({
      user,
      message: "OTP verified."
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not verify OTP." },
      { status: 400 }
    );
  }
}
