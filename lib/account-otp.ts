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

type CreateAccountOtpChallengeOptions = {
  otp?: string;
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

function createOtp(options?: CreateAccountOtpChallengeOptions) {
  if (!options?.otp) {
    return String(randomInt(100000, 1000000));
  }

  if (!/^\d{6}$/.test(options.otp)) {
    throw new Error("OTP must be a 6-digit code.");
  }

  return options.otp;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function createAccountOtpChallenge(
  name: string,
  email: string,
  options?: CreateAccountOtpChallengeOptions
) {
  const secret = getOtpSecret();
  const otp = createOtp(options);
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
  const otpCells = escapedOtp
    .split("")
    .map(
      (digit) => `
        <td align="center" width="16.66%" style="padding: 0 3px;">
          <div style="min-width: 38px; border: 1px solid #e5e5e5; border-radius: 8px; background: #ffffff; color: #111111; font-family: Arial, Helvetica, sans-serif; font-size: 25px; font-weight: 700; line-height: 52px; text-align: center;">
            ${digit}
          </div>
        </td>
      `
    )
    .join("");
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
    subject: "Your IronRoot sign-in code",
    text: `Hi ${name},\n\nUse ${otp} to securely sign in to your IronRoot account. This code expires in 10 minutes.\n\nNever share this code with anyone. IronRoot will never ask you for it.\n\nIf you did not request this email, you can safely ignore it.`,
    html: `
      <!doctype html>
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <meta name="x-apple-disable-message-reformatting" />
          <title>Your IronRoot sign-in code</title>
        </head>
        <body style="margin: 0; padding: 0; background: #ffffff;">
          <div style="display: none; max-height: 0; overflow: hidden; opacity: 0; color: transparent;">
            Your IronRoot verification code is ${escapedOtp}. It expires in 10 minutes.
          </div>

          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width: 100%; border-collapse: collapse; background: #ffffff;">
            <tr>
              <td align="center" style="padding: 28px 12px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width: 100%; max-width: 520px; border-collapse: separate; overflow: hidden; border: 1px solid #e7e7e7; border-radius: 16px; background: #ffffff; box-shadow: 0 12px 34px rgba(17, 17, 17, 0.06);">
                  <tr>
                    <td style="height: 6px; background: #111111; font-size: 0; line-height: 0;">&nbsp;</td>
                  </tr>
                  <tr>
                    <td align="center" style="padding: 32px 28px 10px;">
                      <img
                        src="https://admin.ironrootnutrition.com/wp-content/uploads/2026/06/black-img.png"
                        width="168"
                        alt="IronRoot Nutrition"
                        style="display: block; width: 168px; max-width: 70%; height: auto; border: 0;"
                      />
                    </td>
                  </tr>
                  <tr>
                    <td align="center" style="padding: 14px 28px 0;">
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse: collapse;">
                        <tr>
                          <td style="width: 25%; border-top: 2px dotted #ee7a2d; font-size: 0; line-height: 0;">&nbsp;</td>
                          <td align="center" style="padding: 0 12px; color: #e96616; font-family: Arial, Helvetica, sans-serif; font-size: 10px; font-weight: 700; letter-spacing: 1.5px; line-height: 14px; text-transform: uppercase; white-space: nowrap;">
                            Account access
                          </td>
                          <td style="width: 25%; border-top: 2px dotted #ee7a2d; font-size: 0; line-height: 0;">&nbsp;</td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td align="center" style="padding: 20px 28px 0;">
                      <h1 style="margin: 0; color: #111111; font-family: Arial, Helvetica, sans-serif; font-size: 27px; font-weight: 700; letter-spacing: -0.6px; line-height: 34px;">
                        Let&rsquo;s get you signed in
                      </h1>
                    </td>
                  </tr>
                  <tr>
                    <td align="center" style="padding: 12px 36px 0;">
                      <p style="margin: 0; color: #555555; font-family: Arial, Helvetica, sans-serif; font-size: 14px; line-height: 22px;">
                        Hi <strong style="color: #111111;">${escapedName}</strong>, use this one-time code to securely access your IronRoot account.
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td align="center" style="padding: 8px 36px 0;">
                      <p style="margin: 0; color: #777777; font-family: Arial, Helvetica, sans-serif; font-size: 12px; line-height: 18px;">
                        This code expires in <strong style="color: #e96616;">10 minutes</strong>.
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 26px 24px 24px;">
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" aria-label="Your six digit verification code" style="width: 100%; border-collapse: separate;">
                        <tr>
                          ${otpCells}
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 0 28px;">
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width: 100%; border-collapse: separate; border: 1px solid #ededed; border-radius: 10px; background: #ffffff;">
                        <tr>
                          <td style="width: 4px; border-radius: 10px 0 0 10px; background: #e96616; font-size: 0; line-height: 0;">&nbsp;</td>
                          <td style="padding: 15px 16px;">
                            <p style="margin: 0 0 4px; color: #111111; font-family: Arial, Helvetica, sans-serif; font-size: 12px; font-weight: 700; line-height: 18px;">
                              Keep your code private
                            </p>
                            <p style="margin: 0; color: #666666; font-family: Arial, Helvetica, sans-serif; font-size: 11px; line-height: 17px;">
                              IronRoot will never call, email, or message you asking for this code.
                            </p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td align="center" style="padding: 24px 28px 30px;">
                      <p style="margin: 0; color: #999999; font-family: Arial, Helvetica, sans-serif; font-size: 10px; line-height: 16px;">
                        If you didn&rsquo;t request this email, you can safely ignore it.
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td align="center" style="border-top: 1px solid #ededed; background: #ffffff; padding: 18px 24px;">
                      <p style="margin: 0; color: #111111; font-family: Arial, Helvetica, sans-serif; font-size: 10px; font-weight: 700; letter-spacing: 1.6px; line-height: 15px; text-transform: uppercase;">
                        IronRoot Nutrition
                      </p>
                      <p style="margin: 3px 0 0; color: #9a9a9a; font-family: Arial, Helvetica, sans-serif; font-size: 9px; line-height: 14px;">
                        Strength rooted in better nutrition.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `
  });
}
