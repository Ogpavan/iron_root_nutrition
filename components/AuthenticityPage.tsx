"use client";

import { CheckCircle2, Search, ShieldCheck, XCircle } from "lucide-react";
import Image from "next/image";
import { FormEvent, useMemo, useState } from "react";
import type { HomeProduct } from "@/lib/home-data";
import type { WooCatalogCategory } from "@/lib/woocommerce";
import SiteHeader from "@/components/SiteHeader";

const authenticityHeroImage =
  "https://admin.ironrootnutrition.com/wp-content/uploads/2026/06/ChatGPT-Image-Jun-16-2026-04_18_41-PM.png";
const authenticityHeroMobileImage =
  "https://admin.ironrootnutrition.com/wp-content/uploads/2026/06/ChatGPT-Image-Jun-16-2026-04_13_29-PM.png";

type AuthenticityPageProps = {
  products: HomeProduct[];
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
    };

function normalizeCode(value: string | number | undefined) {
  return String(value ?? "")
    .replace(/\s+/g, "")
    .trim()
    .toLowerCase();
}

export default function AuthenticityPage({ products, categories }: AuthenticityPageProps) {
  const [barcode, setBarcode] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [verification, setVerification] = useState<VerificationState>({ status: "idle" });

  const productByCode = useMemo(() => {
    const lookup = new Map<string, HomeProduct>();

    products.forEach((product) => {
      [product.barcode, product.sku, product.id].forEach((code) => {
        const normalized = normalizeCode(code);

        if (normalized) {
          lookup.set(normalized, product);
        }
      });
    });

    return lookup;
  }, [products]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const product = productByCode.get(normalizeCode(barcode));

    setVerification(product ? { status: "valid" } : { status: "invalid" });
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
          <form className="authenticity-form" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="barcode">Barcode</label>
              <div className="authenticity-input-wrap">
                <Search size={18} aria-hidden="true" />
                <input
                  id="barcode"
                  value={barcode}
                  onChange={(event) => setBarcode(event.target.value)}
                  placeholder="Enter barcode or product ID"
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

            <button type="submit">Verify product</button>
          </form>

          <div className={`authenticity-result is-${verification.status}`} aria-live="polite">
            {verification.status === "idle" ? (
              <>
                <ShieldCheck size={28} aria-hidden="true" />
                <p>Barcode verification results will appear here.</p>
              </>
            ) : null}

            {verification.status === "valid" ? (
              <>
                <CheckCircle2 size={30} aria-hidden="true" />
                <div>
                  <p>Verification request submitted</p>
                  <span>
                    Your barcode has been recorded. Our support team will review the details and
                    follow up shortly{mobile || email ? " using the contact information provided" : ""}.
                  </span>
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
