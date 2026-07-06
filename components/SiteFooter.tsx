"use client";

import {
  ChevronRight,
  FlaskConical,
  Mail,
  Package,
  Phone,
  ShieldCheck,
  Zap
} from "lucide-react";
import Image from "next/image";
import { FormEvent, useState } from "react";

const footerLogo =
  "https://admin.ironrootnutrition.com/wp-content/uploads/2026/06/black-img.png";
const footerProductsImage =
  "https://admin.ironrootnutrition.com/wp-content/uploads/2026/06/ChatGPT_Image_Jun_16__2026__12_15_06_PM-removebg-preview.png";

const categories = [
  { label: "Protein", href: "/all-products?category=protein", icon: Package },
  { label: "Mass Gainer", href: "/all-products?category=mass-gainer", icon: Package },
  { label: "Pre Workout", href: "/all-products?category=pre-workout", icon: Zap },
  { label: "Creatine", href: "/all-products?category=creatine", icon: FlaskConical },
  { label: "BCAA", href: "/all-products?category=bcaa", icon: FlaskConical },
  { label: "Post Workout", href: "/all-products?category=glutamine", icon: Package }
];

const helpLinks = [
  { label: "About Us", href: "/support" },
  { label: "FAQ", href: "/support#faq" },
  { label: "Shipping Information", href: "/support#faq" },
  { label: "Returns & Refunds", href: "/support#faq" },
  { label: "Contact Us", href: "/support#contact-form" },
  { label: "Authenticity Check", href: "/authenticity" }
];

const assuranceItems = [
  {
    title: "Banned Substance Free",
    text: "Third-party tested for purity",
    icon: ShieldCheck
  },
  {
    title: "Informed Choice Certified",
    text: "Trusted by athletes worldwide",
    icon: FlaskConical
  },
  {
    title: "Clean & Effective",
    text: "No fillers. No shortcuts.",
    icon: Package
  }
];

const paymentMethods = [
  { label: "Visa", src: "/assets/payment/visa.svg", width: 58, height: 19 },
  { label: "Mastercard", src: "/assets/payment/mastercard.svg", width: 42, height: 26 },
  { label: "RuPay", src: "/assets/payment/rupay.svg", width: 58, height: 17 },
  { label: "UPI", src: "/assets/payment/upi.svg", width: 58, height: 21 }
] as const;

export default function SiteFooter() {
  const [footerEmail, setFooterEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!footerEmail.trim()) {
      return;
    }

    setSubscribed(true);
  };

  return (
    <footer className="footer">
      <div className="footer-shell">
        <div className="footer-main">
          <section className="footer-brand" aria-label="IronRoot support">
            <Image src={footerLogo} width={260} height={47} alt="IronRoot" />
            <p className="footer-tagline">Fuel your potential</p>
            <p className="footer-copy">
              Premium performance nutrition engineered for strength, endurance and real results.
            </p>

            <div className="footer-contact-list">
              <a className="footer-contact-row" href="mailto:support@ironrootnutrition.com">
                <span>
                  <Mail size={20} aria-hidden="true" />
                </span>
                <strong>Email Support</strong>
                <em>support@ironrootnutrition.com</em>
                <ChevronRight size={17} aria-hidden="true" />
              </a>
              <a className="footer-contact-row" href="tel:+18001234567">
                <span>
                  <Phone size={20} aria-hidden="true" />
                </span>
                <strong>+1 (800) 123-4567</strong>
                <em>Mon-Sat, 9AM - 6PM</em>
                <ChevronRight size={17} aria-hidden="true" />
              </a>
            </div>
          </section>

          <section className="footer-link-column" aria-label="Shop categories">
            <h3>Shop Categories</h3>
            {categories.map((item) => {
              const Icon = item.icon;
              return (
                <a href={item.href} key={item.label}>
                  <Icon size={18} aria-hidden="true" />
                  <span>{item.label}</span>
                  <ChevronRight size={16} aria-hidden="true" />
                </a>
              );
            })}
          </section>

          <section className="footer-link-column" aria-label="Help and support">
            <h3>Help & Support</h3>
            {helpLinks.map((item) => (
              <a href={item.href} key={item.label}>
                <span>{item.label}</span>
                <ChevronRight size={16} aria-hidden="true" />
              </a>
            ))}
          </section>

          <section className="footer-community" aria-label="Newsletter">
            <h3>
              Join the <span>IronRoot</span> community
            </h3>
            <p>Get exclusive offers, early access to new launches and performance tips.</p>
            <form className="footer-newsletter" onSubmit={handleSubscribe}>
              <label htmlFor="footer-email">Email address</label>
              <div>
                <input
                  id="footer-email"
                  type="email"
                  placeholder="Enter your email address"
                  value={footerEmail}
                  onChange={(event) => {
                    setFooterEmail(event.target.value);
                    setSubscribed(false);
                  }}
                  required
                />
                <button type="submit">{subscribed ? "Subscribed" : "Subscribe"}</button>
              </div>
            </form>
            <p className="footer-note">
              <ShieldCheck size={15} aria-hidden="true" />
              No spam. Unsubscribe anytime.
            </p>
            <Image
              src={footerProductsImage}
              width={360}
              height={260}
              alt="IronRoot products"
              className="footer-products"
            />
          </section>
        </div>

        <div className="footer-assurance" aria-label="Product assurance">
          {assuranceItems.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title}>
                <Icon size={30} aria-hidden="true" />
                <span>
                  <strong>{item.title}</strong>
                  <em>{item.text}</em>
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="footer-bottom">
        <p>© 2026 IronRoot Nutrition. All rights reserved.</p>
        <nav aria-label="Footer legal links">
          <a href="/privacy-policy">Privacy Policy</a>
          <a href="/terms-of-service">Terms of Service</a>
          <a href="/support#faq">Refund Policy</a>
          <a href="/sitemap.xml">Sitemap</a>
        </nav>
        <div className="footer-payments" aria-label="Payment methods">
          {paymentMethods.map((item) => (
            <span key={item.label} title={item.label}>
              <Image
                src={item.src}
                width={item.width}
                height={item.height}
                alt={item.label}
                className="payment-logo"
                unoptimized
              />
            </span>
          ))}
        </div>
      </div>
    </footer>
  );
}
