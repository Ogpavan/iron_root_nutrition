"use client";

import {
  Check,
  LockKeyhole,
  ShieldCheck,
  ShoppingBag,
  Tag
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { useCart } from "@/components/cart/CartProvider";
import SiteHeader from "@/components/SiteHeader";
import type { WooCatalogCategory } from "@/lib/woocommerce";

type CheckoutPageProps = {
  categories: WooCatalogCategory[];
};

type RazorpayOrderResponse = {
  keyId?: string;
  orderId?: string;
  amount?: number;
  currency?: string;
  error?: string;
};

type RazorpayPaymentResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

type RazorpayVerifyResponse = {
  verified?: boolean;
  order?: {
    id?: number;
    number?: string;
    status?: string;
  };
  error?: string;
};

type CheckoutCustomer = {
  firstName: string;
  lastName: string;
  emailOrPhone: string;
  phone: string;
  country: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  pincode: string;
};

type CheckoutPayload = {
  items: {
    id?: number | string;
    href?: string;
    name: string;
    quantity: number;
  }[];
  customer: CheckoutCustomer;
};

type RazorpayCheckoutOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayPaymentResponse) => void;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  theme?: {
    color: string;
  };
  modal?: {
    ondismiss?: () => void;
  };
  retry?: {
    enabled: boolean;
    max_count?: number;
  };
};

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayCheckoutOptions) => {
      open: () => void;
    };
  }
}

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0
});

function readPrice(value: string) {
  const parsed = Number(value.replace(/[^0-9.]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function getFormString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function buildCheckoutPayload(formData: FormData, items: CheckoutPayload["items"]): CheckoutPayload {
  return {
    items: items.map((item) => ({
      id: item.id,
      href: item.href,
      name: item.name,
      quantity: item.quantity
    })),
    customer: {
      firstName: getFormString(formData, "firstName"),
      lastName: getFormString(formData, "lastName"),
      emailOrPhone: getFormString(formData, "email"),
      phone: getFormString(formData, "mobile"),
      country: getFormString(formData, "country") || "India",
      address1: getFormString(formData, "address1"),
      address2: getFormString(formData, "address2"),
      city: getFormString(formData, "city"),
      state: getFormString(formData, "state"),
      pincode: getFormString(formData, "pincode")
    }
  };
}

function loadRazorpayScript() {
  return new Promise<boolean>((resolve) => {
    if (typeof window === "undefined") {
      resolve(false);
      return;
    }

    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function CheckoutPage({ categories }: CheckoutPageProps) {
  const router = useRouter();
  const { clearCart, isHydrated, items, itemCount, subtotal } = useCart();
  const [complete, setComplete] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  const total = subtotal;
  const includedTax = Math.round((total * 0.18) / 1.18);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (paymentProcessing) {
      return;
    }

    const formData = new FormData(event.currentTarget);
    const checkoutPayload = buildCheckoutPayload(formData, items);
    const { firstName, lastName, emailOrPhone, phone } = checkoutPayload.customer;
    const name = `${firstName} ${lastName}`.trim();

    setPaymentError("");
    setPaymentProcessing(true);

    try {
      const scriptLoaded = await loadRazorpayScript();

      if (!scriptLoaded || !window.Razorpay) {
        throw new Error("Could not load Razorpay checkout. Please try again.");
      }

      const orderResponse = await fetch("/api/razorpay/order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          items: items.map((item) => ({
            id: item.id,
            href: item.href,
            name: item.name,
            quantity: item.quantity
          }))
        })
      });
      const order = (await orderResponse.json()) as RazorpayOrderResponse;

      if (!orderResponse.ok || !order.keyId || !order.orderId || typeof order.amount !== "number") {
        throw new Error(order.error ?? "Could not create Razorpay order.");
      }

      const razorpayKeyId = order.keyId;
      const razorpayOrderId = order.orderId;
      const razorpayAmount = order.amount;
      const razorpayCurrency = order.currency ?? "INR";
      const Razorpay = window.Razorpay;

      await new Promise<void>((resolve, reject) => {
        let completed = false;
        const checkout = new Razorpay({
          key: razorpayKeyId,
          amount: razorpayAmount,
          currency: razorpayCurrency,
          name: "IronRoot Nutrition",
          description: `Payment for ${itemCount} item${itemCount === 1 ? "" : "s"}`,
          order_id: razorpayOrderId,
          prefill: {
            name,
            email: emailOrPhone.includes("@") ? emailOrPhone : undefined,
            contact: phone || (!emailOrPhone.includes("@") ? emailOrPhone : undefined)
          },
          theme: {
            color: "#111111"
          },
          retry: {
            enabled: true,
            max_count: 1
          },
          modal: {
            ondismiss: () => {
              if (!completed) {
                reject(new Error("Payment was cancelled."));
              }
            }
          },
          handler: async (response) => {
            try {
              const verifyResponse = await fetch("/api/razorpay/verify", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json"
                },
                body: JSON.stringify({
                  ...response,
                  checkout: checkoutPayload
                })
              });
              const verification = (await verifyResponse.json()) as RazorpayVerifyResponse;

              if (!verifyResponse.ok || !verification.verified || !verification.order?.id) {
                throw new Error(verification.error ?? "Payment verification failed.");
              }

              completed = true;
              clearCart();
              setComplete(true);
              resolve();
            } catch (error) {
              reject(error);
            }
          }
        });

        checkout.open();
      });
    } catch (error) {
      setPaymentError(error instanceof Error ? error.message : "Payment could not be completed.");
    } finally {
      setPaymentProcessing(false);
    }
  };

  return (
    <>
      <SiteHeader variant="solid" categories={categories} />
      <main className="checkout-page shopify-checkout">
        <div className="checkout-shell">
          <div className="checkout-main">
            <section className="checkout-brand-block" aria-labelledby="checkout-title">
              <a className="checkout-brand-link" href="/">
                IronRoot Nutrition
              </a>
              <h1 id="checkout-title">Checkout</h1>
            </section>

            {!isHydrated ? (
              <section className="checkout-empty">
                <ShoppingBag size={32} aria-hidden="true" />
                <h2>Loading checkout</h2>
                <p>Loading cart.</p>
              </section>
            ) : complete ? (
              <section className="checkout-success" aria-label="Order confirmation">
                <span className="checkout-success-icon">
                  <Check size={28} aria-hidden="true" />
                </span>
                <h2>Order received</h2>
                <p>We have received your request and our team will contact you shortly.</p>
                <button type="button" onClick={() => router.push("/all-products")}>
                  Continue shopping
                </button>
              </section>
            ) : itemCount > 0 ? (
              <form id="checkout-form" className="checkout-form" onSubmit={handleSubmit}>
                <section className="checkout-panel">
                  <div className="checkout-panel-title">
                    <div>
                      <h2>Contact</h2>
                    </div>
                  </div>
                  <div className="checkout-grid">
                    <div>
                      <label htmlFor="email">Email or phone</label>
                      <input id="email" name="email" type="text" required />
                    </div>
                  </div>
                  <label className="checkout-checkline">
                    <input type="checkbox" defaultChecked />
                    <span>Send offers</span>
                  </label>
                </section>

                <section className="checkout-panel">
                  <div className="checkout-panel-title">
                    <div>
                      <h2>Delivery</h2>
                    </div>
                  </div>
                  <div className="checkout-grid">
                    <div>
                      <label htmlFor="country">Country/Region</label>
                      <select id="country" name="country" defaultValue="India" required>
                        <option>India</option>
                      </select>
                    </div>
                  </div>
                  <div className="checkout-grid two-up">
                    <div>
                      <label htmlFor="first-name">First name</label>
                      <input id="first-name" name="firstName" type="text" required />
                    </div>
                    <div>
                      <label htmlFor="last-name">Last name</label>
                      <input id="last-name" name="lastName" type="text" required />
                    </div>
                  </div>
                  <div className="checkout-grid">
                    <div>
                      <label htmlFor="address1">Address</label>
                      <input id="address1" name="address1" type="text" required />
                    </div>
                    <div>
                      <label htmlFor="address2">Apartment, suite</label>
                      <input id="address2" name="address2" type="text" />
                    </div>
                  </div>
                  <div className="checkout-grid three-up">
                    <div>
                      <label htmlFor="city">City</label>
                      <input id="city" name="city" type="text" required />
                    </div>
                    <div>
                      <label htmlFor="state">State</label>
                      <input id="state" name="state" type="text" required />
                    </div>
                    <div>
                      <label htmlFor="pincode">PIN code</label>
                      <input id="pincode" name="pincode" type="text" required />
                    </div>
                  </div>
                  <div className="checkout-grid">
                    <div>
                      <label htmlFor="mobile">Phone</label>
                      <input id="mobile" name="mobile" type="tel" required />
                    </div>
                  </div>
                  <label className="checkout-checkline">
                    <input type="checkbox" />
                    <span>Save info</span>
                  </label>
                </section>

                <section className="checkout-panel">
                  <div className="checkout-panel-title">
                    <div>
                      <h2>Payment</h2>
                    </div>
                  </div>
                  <div className="checkout-options compact">
                    <div className="checkout-option is-static" aria-hidden="true">
                      <ShieldCheck size={18} aria-hidden="true" />
                      <span>
                        <strong>Razorpay secure payment</strong>
                        <em>UPI, cards, netbanking and wallets</em>
                      </span>
                    </div>
                  </div>
                </section>

              </form>
            ) : (
              <section className="checkout-empty">
                <ShoppingBag size={32} aria-hidden="true" />
                <h2>Your cart is empty</h2>
                <p>Add products first.</p>
                <button type="button" onClick={() => router.push("/all-products")}>
                  Continue shopping
                </button>
              </section>
            )}
          </div>

          {isHydrated && !complete && itemCount > 0 ? (
            <aside className="checkout-summary" aria-label="Order summary">
              <div className="checkout-summary-head">
                <h2>Order summary</h2>
                <span>{itemCount} items</span>
              </div>

              <div className="checkout-summary-items">
                {items.map((item) => {
                  const linePrice = readPrice(item.price) * item.quantity;

                  return (
                    <div className="checkout-summary-item" key={item.key}>
                      <span className="checkout-summary-image">
                        <Image src={item.image} alt={item.name} fill sizes="64px" />
                        <em>{item.quantity}</em>
                      </span>
                      <div>
                        <strong>{item.name}</strong>
                        <small>{item.tag ?? "IronRoot"}</small>
                      </div>
                      <span>{currencyFormatter.format(linePrice)}</span>
                    </div>
                  );
                })}
              </div>

              <div className="checkout-discount">
                <label htmlFor="discount-code">Discount code or gift card</label>
                <div>
                  <Tag size={16} aria-hidden="true" />
                  <input id="discount-code" type="text" />
                  <button type="button">Apply</button>
                </div>
              </div>

              <div className="checkout-summary-lines">
                <div>
                  <span>Subtotal</span>
                  <strong>{currencyFormatter.format(subtotal)}</strong>
                </div>
                <div>
                  <span>Shipping</span>
                  <strong>Calculated later</strong>
                </div>
                <div>
                  <span>Estimated taxes</span>
                  <strong>{currencyFormatter.format(includedTax)}</strong>
                </div>
                <div className="is-total">
                  <span>Total</span>
                  <strong>{currencyFormatter.format(total)}</strong>
                </div>
              </div>

              <p className="checkout-summary-note">
                <ShieldCheck size={15} aria-hidden="true" />
                Razorpay secured payment.
              </p>

              <div className="checkout-actions">
                <button className="checkout-submit" type="submit" form="checkout-form" disabled={paymentProcessing}>
                  <LockKeyhole size={16} aria-hidden="true" />
                  {paymentProcessing ? "Opening Razorpay..." : "Pay securely with Razorpay"}
                </button>
                {paymentError ? (
                  <p className="checkout-payment-error" role="alert">
                    {paymentError}
                  </p>
                ) : null}
                <p className="checkout-payment-trust">
                  Powered by Razorpay - UPI, cards and wallets supported.
                </p>
                <a href="/all-products">Return to shopping</a>
              </div>
            </aside>
          ) : null}
        </div>
      </main>
    </>
  );
}
