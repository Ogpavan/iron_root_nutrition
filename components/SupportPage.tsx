"use client";

import { ChevronDown, ChevronRight, Clock3, Mail, MessageCircle, Phone, Send, Star } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import SiteHeader from "@/components/SiteHeader";
import type { HomeProduct } from "@/lib/home-data";
import type { WooCatalogCategory } from "@/lib/woocommerce";

type SupportPageProps = {
  categories: WooCatalogCategory[];
  products: HomeProduct[];
};

const supportImage =
  "https://admin.ironrootnutrition.com/wp-content/uploads/2026/06/ChatGPT-Image-Jun-17-2026-11_25_35-AM.png";

const supportHighlights = [
  {
    title: "Customer service hours",
    text: "Monday to Saturday: 9:00 AM - 6:00 PM. Closed on major public holidays.",
    icon: Clock3
  },
  {
    title: "Prefer a quick message?",
    text: "Use the contact form and we will get back to you within one working day.",
    icon: MessageCircle
  },
  {
    title: "Questions about your order?",
    text: "Please include your order number and checkout email so we can help faster.",
    icon: Mail
  }
];

const faqs = [
  {
    question: "How do I verify my product?",
    answer: "Use the authenticity page and enter the barcode or product code printed on your pack."
  },
  {
    question: "Do you offer free shipping?",
    answer: "Free delivery is available on qualifying orders. The current threshold is shown in the top announcement bar."
  },
  {
    question: "Which products should I choose for strength?",
    answer: "Creatine, pre-workout, protein, and recovery essentials are the most common strength-focused choices."
  },
  {
    question: "Can I track my order?",
    answer: "Yes. Contact support with your order number and checkout email if you need a delivery update."
  },
  {
    question: "What is your return policy?",
    answer: "Unopened products can be reviewed for return eligibility. Contact support before sending anything back."
  }
];

export default function SupportPage({ categories, products }: SupportPageProps) {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <>
      <SiteHeader variant="solid" categories={categories} searchProducts={products} />
      <main className="support-page">
        <section className="support-hero">
          <div className="support-hero-copy">
            <p>Contact</p>
            <h1>How can we help you?</h1>
            <span>
              Need help with an order, product choice, delivery, or authenticity check?
              Our support team is here to keep your training routine moving.
            </span>
            <div className="support-hero-actions">
              <a className="support-button dark" href="tel:+18001234567">
                <Phone aria-hidden="true" size={15} />
                Call us
              </a>
              <a className="support-button" href="mailto:support@ironrootnutrition.com">
                <Mail aria-hidden="true" size={15} />
                Email us
              </a>
            </div>
          </div>
          <div className="support-hero-image">
            <Image src={supportImage} alt="IronRoot support specialist" width={720} height={720} priority />
          </div>
        </section>

        <nav className="support-breadcrumb" aria-label="Breadcrumb">
          <a href="/">Homepage</a>
          <ChevronRight aria-hidden="true" size={14} />
          <span>Support</span>
        </nav>

        <section className="support-highlights" aria-label="Support information">
          {supportHighlights.map((item) => {
            const Icon = item.icon;

            return (
              <article key={item.title}>
                <Icon aria-hidden="true" size={24} />
                <h2>{item.title}</h2>
                <p>{item.text}</p>
              </article>
            );
          })}
        </section>

        <section className="support-form-section" id="contact-form">
          <h2>Contact form</h2>
          <form className="support-form" onSubmit={(event) => event.preventDefault()}>
            <label>
              Name *
              <input type="text" name="name" required />
            </label>
            <label>
              Company
              <input type="text" name="company" />
            </label>
            <label>
              Email *
              <input type="email" name="email" required />
            </label>
            <label>
              Phone number
              <input type="tel" name="phone" />
            </label>
            <label className="support-form-message">
              Message *
              <textarea name="message" rows={8} required />
            </label>
            <button type="submit">
              <Send aria-hidden="true" size={15} />
              Send
            </button>
          </form>
        </section>

        <section className="support-map" aria-label="Google Maps location">
          <div className="support-map-copy">
            <p>Visit us</p>
            <h2>Find us on the map</h2>
          </div>
          <div className="support-map-frame">
            <iframe
              title="IronRoot Nutrition on Google Maps"
              src="https://www.google.com/maps?q=IronRoot%20Nutrition&z=15&output=embed"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </section>

        <section className="support-faq" id="faq">
          <h2>Frequently asked questions</h2>
          <p>Here are some common questions about IronRoot orders, products, and support.</p>
          <div className="support-faq-list">
            {faqs.map((item, index) => {
              const isOpen = openFaq === index;

              return (
                <article key={item.question} data-open={isOpen}>
                  <button type="button" onClick={() => setOpenFaq(isOpen ? null : index)}>
                    <span>{item.question}</span>
                    <ChevronDown aria-hidden="true" size={18} />
                  </button>
                  <div>
                    <p>{item.answer}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="support-service-band" aria-label="Support channels">
          <div>
            <Mail aria-hidden="true" size={28} />
            <h3>Email us</h3>
            <p>Monday to Saturday support</p>
          </div>
          <div>
            <Phone aria-hidden="true" size={28} />
            <h3>Call us</h3>
            <p>+1 (800) 123-4567</p>
          </div>
          <div>
            <MessageCircle aria-hidden="true" size={28} />
            <h3>Live chat</h3>
            <p>Quick product questions</p>
          </div>
          <div>
            <Star aria-hidden="true" size={28} />
            <h3>Reviews</h3>
            <p>Trusted by customers</p>
          </div>
        </section>
      </main>
    </>
  );
}
