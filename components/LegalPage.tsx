import { ChevronRight, Mail, ShieldCheck } from "lucide-react";
import SiteHeader from "@/components/SiteHeader";
import type { HomeProduct } from "@/lib/home-data";
import type { WooCatalogCategory } from "@/lib/woocommerce";

type LegalSection = {
  title: string;
  body: string[];
};

type LegalPageProps = {
  categories: WooCatalogCategory[];
  products: HomeProduct[];
  eyebrow: string;
  title: string;
  intro: string;
  updatedAt: string;
  sections: LegalSection[];
};

export const privacyPolicySections: LegalSection[] = [
  {
    title: "Information we collect",
    body: [
      "We collect information you provide when you browse, create an account, place an order, contact support, request product authenticity help, subscribe to updates, or use checkout features. This may include your name, email address, phone number, billing and shipping address, order details, payment status, product preferences, support messages, and account activity.",
      "We may also collect technical information such as device type, browser, IP address, pages viewed, referring URLs, approximate location, cart activity, and cookie or similar identifier data."
    ]
  },
  {
    title: "How we use information",
    body: [
      "We use information to operate the store, process orders, arrange shipping, provide customer support, verify product authenticity requests, manage accounts, prevent fraud, improve product selection, personalize shopping features, send service messages, and send marketing only where permitted.",
      "We may use aggregated or de-identified information to understand store performance, product demand, and customer experience trends."
    ]
  },
  {
    title: "Payments and checkout",
    body: [
      "Payments are handled through payment service providers. We do not intentionally store full card numbers or sensitive payment authentication details on our storefront. Payment providers may process transaction data according to their own terms and privacy notices.",
      "Order, billing, shipping, discount, and payment confirmation data may be shared between IronRoot Nutrition, WooCommerce, payment processors, logistics partners, and support tools so your order can be completed and serviced."
    ]
  },
  {
    title: "Cookies and analytics",
    body: [
      "We use cookies and similar technologies for cart functionality, account sessions, checkout security, site performance, analytics, and marketing measurement. Some cookies are necessary for the store to work correctly.",
      "You can control cookies through your browser settings. Blocking some cookies may affect cart, checkout, account, or personalization features."
    ]
  },
  {
    title: "Sharing information",
    body: [
      "We share information with service providers who help us run the store, including hosting, WooCommerce, payment processing, fraud prevention, shipping, email, analytics, customer support, and marketing tools.",
      "We may disclose information if required by law, to protect our rights, to investigate misuse, to complete a business transfer, or with your direction or consent."
    ]
  },
  {
    title: "Retention",
    body: [
      "We keep personal information only as long as needed for the purposes described in this policy, including order fulfillment, warranty and authenticity support, tax and accounting records, fraud prevention, dispute handling, and legal compliance.",
      "When information is no longer needed, we delete it, anonymize it, or retain it only where a lawful reason requires continued storage."
    ]
  },
  {
    title: "Your choices and rights",
    body: [
      "You may request access, correction, deletion, portability, withdrawal of consent, or opt-out of marketing communications where applicable law provides those rights. We may need to verify your identity before responding.",
      "Marketing emails include an unsubscribe option. Transactional messages about orders, security, support, or account activity may still be sent when necessary."
    ]
  },
  {
    title: "Security",
    body: [
      "We use reasonable administrative, technical, and organizational safeguards to protect information. No internet or payment system is perfectly secure, so we cannot guarantee absolute security.",
      "If you believe your account or order information has been misused, contact us immediately."
    ]
  },
  {
    title: "Children",
    body: [
      "Our store is intended for customers who can legally purchase nutrition and supplement products in their location. We do not knowingly collect personal information from children without appropriate consent."
    ]
  },
  {
    title: "Changes to this policy",
    body: [
      "We may update this Privacy Policy to reflect changes in our store, technology, legal requirements, or business practices. The updated version will be posted on this page with a new effective date."
    ]
  }
];

export const termsOfServiceSections: LegalSection[] = [
  {
    title: "Using the store",
    body: [
      "By accessing or purchasing from IronRoot Nutrition, you agree to use the store only for lawful purposes and in a way that does not interfere with the site, checkout, accounts, support systems, or other customers.",
      "You are responsible for providing accurate account, billing, shipping, and contact information. We may refuse, cancel, or limit orders where information appears incomplete, inaccurate, fraudulent, or inconsistent with these terms."
    ]
  },
  {
    title: "Products and health information",
    body: [
      "Product descriptions, nutrition information, images, availability, and pricing are provided for shopping convenience and may change without notice. Packaging and formulation details should be checked before use.",
      "Information on the site is not medical advice. Consult a qualified health professional before using supplements if you are pregnant, nursing, under medical supervision, have a medical condition, use medication, or are unsure whether a product is appropriate for you."
    ]
  },
  {
    title: "Orders and acceptance",
    body: [
      "Placing an order is an offer to buy the selected products. An order is accepted only when we confirm it and begin fulfillment. We may decline or cancel an order due to stock issues, pricing errors, payment issues, shipping restrictions, suspected misuse, or operational reasons.",
      "If an accepted order cannot be fulfilled, we will contact you using the details provided at checkout and arrange a suitable resolution where possible."
    ]
  },
  {
    title: "Pricing, discounts, and payments",
    body: [
      "Prices, taxes, delivery fees, discounts, and promotions may change without notice. Discounts may be subject to eligibility rules, expiry dates, product exclusions, order minimums, or one-use restrictions.",
      "You authorize our payment providers to process the selected payment method for your order total. Failed, reversed, disputed, or suspected fraudulent payments may delay or cancel fulfillment."
    ]
  },
  {
    title: "Shipping and delivery",
    body: [
      "Delivery estimates are provided for convenience and are not guaranteed unless expressly stated. Shipping times may be affected by address accuracy, courier capacity, customs, holidays, weather, payment review, or events outside our control.",
      "Risk of loss may transfer according to the delivery method and applicable law. Contact support promptly if your order appears damaged, missing, delayed, or incorrectly delivered."
    ]
  },
  {
    title: "Returns, refunds, and cancellations",
    body: [
      "Return, refund, and cancellation eligibility may depend on product condition, seal status, order status, delivery status, hygiene requirements, applicable law, and proof of purchase.",
      "Do not send products back without contacting support first. Opened, used, tampered, expired, or custom-handled products may not be eligible for return unless required by law or approved by our support team."
    ]
  },
  {
    title: "Authenticity and misuse",
    body: [
      "Authenticity tools and support reviews are intended to help customers verify IronRoot Nutrition products. Submitting false, altered, duplicate, or misleading verification requests may result in refusal of service.",
      "You may not resell products in a way that misrepresents source, condition, batch, expiry, authenticity, or affiliation with IronRoot Nutrition."
    ]
  },
  {
    title: "Intellectual property",
    body: [
      "The IronRoot Nutrition name, logos, product images, site design, content, copy, and other materials are owned by or licensed to IronRoot Nutrition. You may not copy, reproduce, modify, distribute, scrape, or commercially exploit them without written permission.",
      "You may share links to public product pages for normal personal or editorial use, provided you do not suggest sponsorship or endorsement without authorization."
    ]
  },
  {
    title: "Limitation of liability",
    body: [
      "To the maximum extent permitted by law, IronRoot Nutrition is not liable for indirect, incidental, special, consequential, punitive, or loss-of-profit damages arising from use of the store, products, delivery services, account features, or support tools.",
      "Nothing in these terms excludes liability that cannot be excluded under applicable law."
    ]
  },
  {
    title: "Changes to these terms",
    body: [
      "We may update these Terms of Service from time to time. The updated version will be posted on this page with a new effective date. Continued use of the store after changes means you accept the updated terms."
    ]
  }
];

export default function LegalPage({
  categories,
  products,
  eyebrow,
  title,
  intro,
  updatedAt,
  sections
}: LegalPageProps) {
  return (
    <>
      <SiteHeader variant="solid" categories={categories} searchProducts={products} />
      <main className="legal-page">
        <section className="legal-hero" aria-labelledby="legal-title">
          <div>
            <p>{eyebrow}</p>
            <h1 id="legal-title">{title}</h1>
            <span>{intro}</span>
          </div>
          <aside aria-label="Document information">
            <ShieldCheck size={26} aria-hidden="true" />
            <strong>Effective date</strong>
            <span>{updatedAt}</span>
          </aside>
        </section>

        <nav className="legal-breadcrumb" aria-label="Breadcrumb">
          <a href="/">Homepage</a>
          <ChevronRight aria-hidden="true" size={14} />
          <span>{title}</span>
        </nav>

        <section className="legal-content" aria-label={`${title} sections`}>
          <div className="legal-sidebar">
            <p>On this page</p>
            {sections.map((section) => (
              <a href={`#${slugify(section.title)}`} key={section.title}>
                {section.title}
              </a>
            ))}
          </div>

          <div className="legal-document">
            {sections.map((section) => (
              <article id={slugify(section.title)} key={section.title}>
                <h2>{section.title}</h2>
                {section.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </article>
            ))}

            <article id="contact">
              <h2>Contact</h2>
              <p>
                For privacy, order, or legal questions, contact IronRoot Nutrition support at{" "}
                <a href="mailto:support@ironrootnutrition.com">support@ironrootnutrition.com</a>.
              </p>
              <a className="legal-contact-link" href="/support#contact-form">
                <Mail size={16} aria-hidden="true" />
                Contact support
              </a>
            </article>
          </div>
        </section>
      </main>
    </>
  );
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
