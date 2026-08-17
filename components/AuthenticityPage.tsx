"use client";

import { CheckCircle2, Search, ShieldCheck, XCircle } from "lucide-react";
import Image from "next/image";
import { FormEvent, useEffect, useState } from "react";
import type { WooCatalogCategory } from "@/lib/woocommerce";
import SiteHeader from "@/components/SiteHeader";

const authenticityHeroImage =
  "https://admin.ironrootnutrition.com/wp-content/uploads/2026/06/ChatGPT-Image-Jun-16-2026-04_18_41-PM.png";
const authenticityHeroMobileImage =
  "https://admin.ironrootnutrition.com/wp-content/uploads/2026/06/ChatGPT-Image-Jun-16-2026-04_13_29-PM.png";

type AuthenticityPageProps = {
  categories: WooCatalogCategory[];
};

type VerificationState =
  | {
      status: "idle";
    }
  | {
      status: "valid";
    }
  | {
      status: "invalid";
    }
  | {
      status: "error";
    }
  | {
      status: "loading";
    };

function normalizeCode(value: string | number | undefined) {
  return String(value ?? "")
    .replace(/\s+/g, "")
    .trim()
    .toLowerCase();
}

export default function AuthenticityPage({ categories }: AuthenticityPageProps) {
  const [barcode, setBarcode] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [authenticityCodes, setAuthenticityCodes] = useState<Record<string, boolean> | null>(null);
  const [codesLoadError, setCodesLoadError] = useState(false);
  const [verification, setVerification] = useState<VerificationState>({ status: "idle" });

  useEffect(() => {
    let isActive = true;

    fetch("/authenticity-codes.json")
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Could not load authenticity codes (${response.status})`);
        }

        return response.json() as Promise<{ codes?: Record<string, boolean> }>;
      })
      .then((payload) => {
        if (!payload.codes || typeof payload.codes !== "object") {
          throw new Error("Authenticity code data is invalid");
        }

        if (isActive) {
          setAuthenticityCodes(payload.codes);
        }
      })
      .catch(() => {
        if (isActive) {
          setCodesLoadError(true);
        }
      });

    return () => {
      isActive = false;
    };
  }, []);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!authenticityCodes) {
      setVerification({ status: codesLoadError ? "error" : "loading" });
      return;
    }

    setVerification(authenticityCodes[normalizeCode(barcode)] ? { status: "valid" } : { status: "invalid" });
  };

  return (
    <>
      <SiteHeader variant="solid" categories={categories} />
      <main className="authenticity-page">
        <section className="authenticity-hero" aria-labelledby="authenticity-title">
          <Image
            src={authenticityHeroImage}
            alt=""
            fill
            priority
            sizes="100vw"
            className="authenticity-hero-image authenticity-hero-image-desktop"
          />
          <Image
            src={authenticityHeroMobileImage}
            alt=""
            fill
            priority
            sizes="100vw"
            className="authenticity-hero-image authenticity-hero-image-mobile"
          />
          <h1 id="authenticity-title" className="sr-only">
            Check product authenticity
          </h1>
        </section>

        <section className="authenticity-panel" aria-label="Authenticity form">
          <form className="authenticity-form" onSubmit={handleSubmit} aria-busy={!authenticityCodes}>
            <div>
              <label htmlFor="barcode">Authenticity code</label>
              <div className="authenticity-input-wrap">
                <Search size={18} aria-hidden="true" />
                <input
                  id="barcode"
                  value={barcode}
                  onChange={(event) => setBarcode(event.target.value)}
                  placeholder="Enter the code printed on your pack"
                  required
                />
              </div>
            </div>

            <div className="authenticity-two-col">
              <div>
                <label htmlFor="mobile">Mobile number <span>optional</span></label>
                <input
                  id="mobile"
                  value={mobile}
                  onChange={(event) => setMobile(event.target.value)}
                  inputMode="tel"
                  placeholder="Enter mobile number"
                />
              </div>
              <div>
                <label htmlFor="email">Email address <span>optional</span></label>
                <input
                  id="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  type="email"
                  placeholder="Enter email address"
                />
              </div>
            </div>

            <button type="submit" disabled={!authenticityCodes || codesLoadError}>
              {codesLoadError ? "Verification unavailable" : authenticityCodes ? "Verify product" : "Loading codes..."}
            </button>
          </form>

          <div className={`authenticity-result is-${verification.status}`} aria-live="polite">
            {verification.status === "idle" ? (
              <>
                <ShieldCheck size={28} aria-hidden="true" />
                <p>
                  {codesLoadError
                    ? "Verification codes could not be loaded. Please try again later."
                    : authenticityCodes
                      ? "Enter the code printed on your pack to verify your product."
                      : "Loading verification codes..."}
                </p>
              </>
            ) : null}

            {verification.status === "loading" ? (
              <>
                <ShieldCheck size={28} aria-hidden="true" />
                <p>Loading verification codes...</p>
              </>
            ) : null}

            {verification.status === "error" ? (
              <>
                <XCircle size={30} aria-hidden="true" />
                <div>
                  <p>Verification is temporarily unavailable.</p>
                  <span>Please try again later.</span>
                </div>
              </>
            ) : null}

            {verification.status === "valid" ? (
              <>
                <CheckCircle2 size={30} aria-hidden="true" />
                <div>
                  <p>This product is authentic</p>
                  <span>The code matches an IronRoot Nutrition authenticity code.</span>
                </div>
              </>
            ) : null}

            {verification.status === "invalid" ? (
              <>
                <XCircle size={30} aria-hidden="true" />
                <div>
                  <p>We could not verify this barcode.</p>
                  <span>Check the number once more or contact support with a clear product photo.</span>
                </div>
              </>
            ) : null}
          </div>
        </section>
      </main>
    </>
  );
}
