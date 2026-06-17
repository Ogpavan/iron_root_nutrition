"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Mail, ShieldCheck, Smartphone, X } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { accountStorageKey, normalizeStoredUser, type AuthUser } from "@/lib/account-auth";

type AccountOtpModalProps = {
  open: boolean;
  onClose: () => void;
  onUserChange?: (user: AuthUser | null) => void;
};

const authModalImage =
  "https://admin.ironrootnutrition.com/wp-content/uploads/2026/06/ChatGPT-Image-Jun-16-2026-04_29_30-PM.png";

function createOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function normalizeIdentifier(value: string) {
  return value.trim();
}

export default function AccountOtpModal({ open, onClose, onUserChange }: AccountOtpModalProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [otp, setOtp] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [step, setStep] = useState<"identity" | "verify">("identity");
  const [message, setMessage] = useState("");

  const identifierType = useMemo(() => {
    return identifier.includes("@") ? "email" : "mobile";
  }, [identifier]);

  const openProfile = () => {
    onClose();
    router.push("/account");
  };

  useEffect(() => {
    const stored = window.localStorage.getItem(accountStorageKey);

    if (!stored) {
      return;
    }

    try {
      const storedUser = normalizeStoredUser(JSON.parse(stored));
      onUserChange?.(storedUser);
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

  const handleRequestOtp = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedName = name.trim();
    const normalized = normalizeIdentifier(identifier);

    if (normalizedName.length < 2) {
      setMessage("Enter your name to continue.");
      return;
    }

    if (normalized.length < 5) {
      setMessage("Enter a valid mobile number or email address.");
      return;
    }

    const nextOtp = createOtp();
    setIdentifier(normalized);
    setGeneratedOtp(nextOtp);
    setOtp("");
    setStep("verify");
    setMessage(`OTP sent. Demo OTP: ${nextOtp}`);
  };

  const handleVerifyOtp = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (otp.trim() !== generatedOtp) {
      setMessage("The OTP does not match. Check the code and try again.");
      return;
    }

    const nextUser = {
      name: name.trim(),
      identifier,
      signedInAt: new Date().toISOString()
    };

    window.localStorage.setItem(accountStorageKey, JSON.stringify(nextUser));
    onUserChange?.(nextUser);
    openProfile();
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
                  <label htmlFor="modal-account-identifier">Mobile number or email</label>
                  <div className="account-input-wrap">
                    {identifierType === "email" ? (
                      <Mail size={18} aria-hidden="true" />
                    ) : (
                      <Smartphone size={18} aria-hidden="true" />
                    )}
                    <input
                      id="modal-account-identifier"
                      value={identifier}
                      onChange={(event) => setIdentifier(event.target.value)}
                      placeholder="Enter mobile or email"
                      autoComplete="username"
                      required
                    />
                  </div>
                  <button type="submit">Send OTP</button>
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
                  <button type="submit">Verify and continue</button>
                  <button
                    type="button"
                    className="account-text-button"
                    onClick={() => {
                      setStep("identity");
                      setOtp("");
                      setGeneratedOtp("");
                      setMessage("");
                    }}
                  >
                    Change mobile or email
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
