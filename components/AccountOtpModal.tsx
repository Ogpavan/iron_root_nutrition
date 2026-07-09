"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Mail, ShieldCheck, X } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import {
  accountStorageKey,
  isValidAuthEmail,
  normalizeAuthEmail,
  normalizeStoredUser,
  type AuthUser
} from "@/lib/account-auth";

type AccountOtpModalProps = {
  open: boolean;
  onClose: () => void;
  onUserChange?: (user: AuthUser | null) => void;
  redirectTo?: string | null;
};

const authModalImage =
  "https://admin.ironrootnutrition.com/wp-content/uploads/2026/06/ChatGPT-Image-Jun-16-2026-04_29_30-PM.png";

export default function AccountOtpModal({
  open,
  onClose,
  onUserChange,
  redirectTo = "/account"
}: AccountOtpModalProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [otp, setOtp] = useState("");
  const [otpToken, setOtpToken] = useState("");
  const [step, setStep] = useState<"identity" | "verify">("identity");
  const [message, setMessage] = useState("");
  const [isRequestingOtp, setIsRequestingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

  const openProfile = () => {
    onClose();
    if (redirectTo) {
      router.push(redirectTo);
    }
  };

  useEffect(() => {
    const stored = window.localStorage.getItem(accountStorageKey);

    if (!stored) {
      return;
    }

    try {
      const storedUser = normalizeStoredUser(JSON.parse(stored));

      if (storedUser) {
        onUserChange?.(storedUser);
      } else {
        window.localStorage.removeItem(accountStorageKey);
        onUserChange?.(null);
      }
    } catch {
      window.localStorage.removeItem(accountStorageKey);
    }
  }, [onUserChange]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const stored = window.localStorage.getItem(accountStorageKey);

    if (!stored) {
      return;
    }

    try {
      const storedUser = normalizeStoredUser(JSON.parse(stored));

      if (storedUser) {
        onUserChange?.(storedUser);
        openProfile();
      } else {
        window.localStorage.removeItem(accountStorageKey);
        onUserChange?.(null);
      }
    } catch {
      window.localStorage.removeItem(accountStorageKey);
    }
  }, [open, onUserChange]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, open]);

  const handleRequestOtp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedName = name.trim();
    const normalized = normalizeAuthEmail(identifier);

    if (normalizedName.length < 2) {
      setMessage("Enter your name to continue.");
      return;
    }

    if (!isValidAuthEmail(normalized)) {
      setMessage("Enter a valid email address.");
      return;
    }

    setIsRequestingOtp(true);
    setMessage("");

    try {
      const response = await fetch("/api/account/otp/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: normalizedName,
          email: normalized
        })
      });
      const data = (await response.json()) as {
        token?: string;
        message?: string;
        error?: string;
      };

      if (!response.ok || !data.token) {
        setMessage(data.error || "Could not send OTP. Please try again.");
        return;
      }

      setIdentifier(normalized);
      setOtpToken(data.token);
      setOtp("");
      setStep("verify");
      setMessage(data.message || "OTP sent to your email address.");
    } catch {
      setMessage("Could not send OTP. Check your connection and try again.");
    } finally {
      setIsRequestingOtp(false);
    }
  };

  const handleVerifyOtp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!otpToken) {
      setStep("identity");
      setMessage("Request a new OTP to continue.");
      return;
    }

    setIsVerifyingOtp(true);
    setMessage("");

    try {
      const response = await fetch("/api/account/otp/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          token: otpToken,
          otp: otp.trim()
        })
      });
      const data = (await response.json()) as {
        user?: AuthUser;
        error?: string;
      };

      if (!response.ok || !data.user) {
        setMessage(data.error || "Could not verify OTP. Please try again.");
        return;
      }

      window.localStorage.setItem(accountStorageKey, JSON.stringify(data.user));
      onUserChange?.(data.user);
      openProfile();
    } catch {
      setMessage("Could not verify OTP. Check your connection and try again.");
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="account-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="account-modal-title"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          <button className="account-modal-backdrop" type="button" aria-label="Close login popup" onClick={onClose} />
          <motion.div
            className="account-modal-panel"
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 14, scale: 0.98 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            <div className="account-modal-image">
              <Image src={authModalImage} alt="" fill sizes="(max-width: 820px) 100vw, 420px" />
            </div>

            <div className="account-modal-content">
              <button className="account-modal-close" type="button" aria-label="Close login popup" onClick={onClose}>
                <X size={18} />
              </button>
              <div className="account-card-head">
                <ShieldCheck size={28} aria-hidden="true" />
                <div>
                  <p>IronRoot account</p>
                  <h2 id="account-modal-title">Login / Sign up</h2>
                </div>
              </div>

              {step === "identity" ? (
                <form className="account-form" onSubmit={handleRequestOtp}>
                  <label htmlFor="modal-account-name">Full name</label>
                  <input
                    id="modal-account-name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Enter your name"
                    autoComplete="name"
                    required
                  />
                  <label htmlFor="modal-account-identifier">Email address</label>
                  <div className="account-input-wrap">
                    <Mail size={18} aria-hidden="true" />
                    <input
                      id="modal-account-identifier"
                      type="email"
                      value={identifier}
                      onChange={(event) => setIdentifier(event.target.value)}
                      placeholder="Enter email address"
                      autoComplete="email"
                      required
                    />
                  </div>
                  <button type="submit" disabled={isRequestingOtp}>
                    {isRequestingOtp ? "Sending..." : "Send OTP"}
                  </button>
                </form>
              ) : (
                <form className="account-form" onSubmit={handleVerifyOtp}>
                  <label htmlFor="modal-account-otp">Enter OTP</label>
                  <input
                    id="modal-account-otp"
                    value={otp}
                    onChange={(event) => setOtp(event.target.value)}
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="6-digit code"
                    autoComplete="one-time-code"
                    required
                  />
                  <button type="submit" disabled={isVerifyingOtp}>
                    {isVerifyingOtp ? "Verifying..." : "Verify and continue"}
                  </button>
                  <button
                    type="button"
                    className="account-text-button"
                    onClick={() => {
                      setStep("identity");
                      setOtp("");
                      setOtpToken("");
                      setMessage("");
                    }}
                  >
                    Change email
                  </button>
                </form>
              )}

              {message ? <p className="account-message">{message}</p> : null}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
