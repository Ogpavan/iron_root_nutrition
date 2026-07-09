import "server-only";

import { createHmac, randomBytes, randomInt, timingSafeEqual } from "crypto";
import nodemailer from "nodemailer";
import type { AuthUser } from "@/lib/account-auth";
import { isValidAuthEmail, normalizeAuthEmail } from "@/lib/account-auth";

type AccountOtpPayload = {
  purpose: "account-otp";
  name: string;
  email: string;
  salt: string;
  otpHash: string;
  expiresAt: number;
};

type SendOtpEmailInput = {
  to: string;
  name: string;
  otp: string;
};

const otpTtlMs = 10 * 60 * 1000;

function getEnvValue(...names: string[]) {
  for (const name of names) {
    const value = process.env[name]?.trim();

    if (value) {
      return value;
    }
  }

  return "";
}

function getOtpSecret() {
  const secret = getEnvValue("AUTH_SESSION_SECRET");

  if (!secret) {
    throw new Error("OTP secret is not configured.");
  }

  return secret;
}

function getSmtpConfig() {
  const host = getEnvValue("SMTP_HOST", "SMTPHost");
  const portValue = getEnvValue("SMTP_PORT", "SMTPPort");
  const user = getEnvValue("SMTP_USER", "SMTPUser");
  const password = getEnvValue("SMTP_PASSWORD", "SMTPPassword");
  const fromEmail = getEnvValue("SMTP_FROM_EMAIL", "FromEmail");
  const fromName = getEnvValue("SMTP_FROM_NAME", "FromName");
  const port = Number(portValue);

  if (!host || !portValue || !user || !password || !fromEmail || !fromName) {
    throw new Error("SMTP credentials are not configured.");
  }

  if (!Number.isInteger(port) || port <= 0) {
    throw new Error("SMTP port is not valid.");
  }

  return { host, port, user, password, fromEmail, fromName };
}

function toBase64Url(value: string | Buffer) {
  return Buffer.from(value)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function fromBase64Url(value: string) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");

  return Buffer.from(padded, "base64").toString("utf8");
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function signPayload(encodedPayload: string, secret: string) {
  return toBase64Url(createHmac("sha256", secret).update(encodedPayload).digest());
}

function hashOtp(otp: string, salt: string, secret: string) {
  return createHmac("sha256", secret).update(`${salt}:${otp}`).digest("hex");
}

function parseOtpPayload(value: unknown): AccountOtpPayload | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const payload = value as Partial<AccountOtpPayload>;

  if (
    payload.purpose !== "account-otp" ||
    typeof payload.name !== "string" ||
    payload.name.trim().length < 2 ||
    typeof payload.email !== "string" ||
    !isValidAuthEmail(payload.email) ||
    typeof payload.salt !== "string" ||
    typeof payload.otpHash !== "string" ||
    typeof payload.expiresAt !== "number"
  ) {
    return null;
  }

  return {
    purpose: "account-otp",
    name: payload.name.trim(),
    email: normalizeAuthEmail(payload.email),
    salt: payload.salt,
    otpHash: payload.otpHash,
    expiresAt: payload.expiresAt
  };
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function createAccountOtpChallenge(name: string, email: string) {
  const secret = getOtpSecret();
  const otp = String(randomInt(100000, 1000000));
  const salt = randomBytes(16).toString("hex");
  const payload: AccountOtpPayload = {
    purpose: "account-otp",
    name: name.trim(),
    email: normalizeAuthEmail(email),
    salt,
    otpHash: hashOtp(otp, salt, secret),
    expiresAt: Date.now() + otpTtlMs
  };
  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const signature = signPayload(encodedPayload, secret);

  return {
    otp,
    token: `${encodedPayload}.${signature}`,
    expiresAt: payload.expiresAt
  };
}

export function verifyAccountOtpChallenge(token: string, otp: string): AuthUser {
  const secret = getOtpSecret();
  const [encodedPayload, signature, extra] = token.split(".");

  if (!encodedPayload || !signature || extra) {
    throw new Error("Request a new OTP to continue.");
  }

  const expectedSignature = signPayload(encodedPayload, secret);

  if (!safeEqual(expectedSignature, signature)) {
    throw new Error("Request a new OTP to continue.");
  }

  let payload: AccountOtpPayload | null = null;

  try {
    payload = parseOtpPayload(JSON.parse(fromBase64Url(encodedPayload)));
  } catch {
    payload = null;
  }

  if (!payload) {
    throw new Error("Request a new OTP to continue.");
  }

  if (Date.now() > payload.expiresAt) {
    throw new Error("OTP has expired. Request a new code.");
  }

  const normalizedOtp = otp.trim();

  if (!/^\d{6}$/.test(normalizedOtp)) {
    throw new Error("Enter the 6-digit OTP.");
  }

  if (!safeEqual(hashOtp(normalizedOtp, payload.salt, secret), payload.otpHash)) {
    throw new Error("The OTP does not match. Check the code and try again.");
  }

  return {
    name: payload.name,
    identifier: payload.email,
    email: payload.email,
    signedInAt: new Date().toISOString()
  };
}

export async function sendSignupOtpEmail({ to, name, otp }: SendOtpEmailInput) {
  const smtp = getSmtpConfig();
  const escapedName = escapeHtml(name);
  const escapedOtp = escapeHtml(otp);
  const transporter = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.port === 465,
    auth: {
      user: smtp.user,
      pass: smtp.password
    }
  });

  await transporter.sendMail({
    from: {
      address: smtp.fromEmail,
      name: smtp.fromName
    },
    to,
    subject: "Your IronRoot OTP code",
    text: `Hi ${name},\n\nYour IronRoot OTP is ${otp}. This code expires in 10 minutes.\n\nIf you did not request this, you can ignore this email.`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.5;">
        <p>Hi ${escapedName},</p>
        <p>Your IronRoot OTP is:</p>
        <p style="font-size: 28px; font-weight: 700; letter-spacing: 6px; margin: 20px 0;">${escapedOtp}</p>
        <p>This code expires in 10 minutes.</p>
        <p>If you did not request this, you can ignore this email.</p>
      </div>
    `
  });
}
