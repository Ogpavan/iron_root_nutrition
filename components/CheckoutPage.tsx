"use client";

import {
  Check,
  LockKeyhole,
  ShoppingBag,
  Tag,
  X
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useState } from "react";
import AccountOtpModal from "@/components/AccountOtpModal";
import { useCart } from "@/components/cart/CartProvider";
import SiteHeader from "@/components/SiteHeader";
import {
  accountStorageKey,
  getAuthUserContact,
  normalizeStoredUser,
  type AuthUser
} from "@/lib/account-auth";
import type { WooCatalogCategory } from "@/lib/woocommerce";

type CheckoutPageProps = {
  categories: WooCatalogCategory[];
};

type RazorpayOrderResponse = {
  keyId?: string;
  orderId?: string;
  amount?: number;
  currency?: string;
  discount?: CheckoutDiscount | null;
  shipping?: CheckoutShippingOption | null;
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
  email: string;
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
    variationId?: number | string;
    variationAttributes?: {
      name: string;
      option: string;
    }[];
    href?: string;
    name: string;
    quantity: number;
  }[];
  customer: CheckoutCustomer;
  discountCode?: string;
  shippingId?: string;
};

type CheckoutDiscount = {
  code: string;
  amount: number;
};

type DiscountResponse = {
  discount?: CheckoutDiscount | null;
  total?: number;
  error?: string;
};

type CheckoutShippingOption = {
  id: string;
  methodId: string;
  instanceId?: number;
  title: string;
  total: number;
};

type ShippingResponse = {
  options?: CheckoutShippingOption[];
  error?: string;
};

type PincodeLookupResponse = {
  pincode?: string;
  district?: string;
  division?: string;
  region?: string;
  block?: string;
  state?: string;
  country?: string;
};

type WooAddress = {
  first_name?: string;
  last_name?: string;
  address_1?: string;
  address_2?: string;
  city?: string;
  state?: string;
  postcode?: string;
  country?: string;
  email?: string;
  phone?: string;
};

type AccountAddressResponse = {
  billing?: WooAddress;
  shipping?: WooAddress;
  defaultAddress?: "billing" | "shipping";
  error?: string;
};

type CheckoutValidationErrors = Partial<Record<keyof CheckoutCustomer, string>>;

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

const requiredCustomerFields: (keyof CheckoutCustomer)[] = [
  "email",
  "country",
  "firstName",
  "address1",
  "city",
  "state",
  "pincode",
  "phone"
];

const indianStates = [
  { code: "AP", name: "Andhra Pradesh" },
  { code: "AR", name: "Arunachal Pradesh" },
  { code: "AS", name: "Assam" },
  { code: "BR", name: "Bihar" },
  { code: "CT", name: "Chhattisgarh" },
  { code: "GA", name: "Goa" },
  { code: "GJ", name: "Gujarat" },
  { code: "HR", name: "Haryana" },
  { code: "HP", name: "Himachal Pradesh" },
  { code: "JH", name: "Jharkhand" },
  { code: "KA", name: "Karnataka" },
  { code: "KL", name: "Kerala" },
  { code: "MP", name: "Madhya Pradesh" },
  { code: "MH", name: "Maharashtra" },
  { code: "MN", name: "Manipur" },
  { code: "ML", name: "Meghalaya" },
  { code: "MZ", name: "Mizoram" },
  { code: "NL", name: "Nagaland" },
  { code: "OD", name: "Odisha" },
  { code: "PB", name: "Punjab" },
  { code: "RJ", name: "Rajasthan" },
  { code: "SK", name: "Sikkim" },
  { code: "TN", name: "Tamil Nadu" },
  { code: "TS", name: "Telangana" },
  { code: "TR", name: "Tripura" },
  { code: "UK", name: "Uttarakhand" },
  { code: "UP", name: "Uttar Pradesh" },
  { code: "WB", name: "West Bengal" },
  { code: "AN", name: "Andaman and Nicobar Islands" },
  { code: "CH", name: "Chandigarh" },
  { code: "DN", name: "Dadra and Nagar Haveli" },
  { code: "DD", name: "Daman and Diu" },
  { code: "DL", name: "Delhi" },
  { code: "JK", name: "Jammu and Kashmir" },
  { code: "LA", name: "Ladakh" },
  { code: "LD", name: "Lakshadweep" },
  { code: "PY", name: "Puducherry" }
];

function normalizeIndianStateValue(value?: string) {
  const normalized = String(value ?? "").trim();

  if (!normalized) {
    return "";
  }

  const upper = normalized.toUpperCase();
  const matchedState = indianStates.find((state) => {
    return state.code === upper || state.name.toUpperCase() === upper;
  });

  return matchedState?.code ?? normalized;
}

function readPrice(value: string) {
  const parsed = Number(value.replace(/[^0-9.]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function getFormString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function validateCheckoutField(key: keyof CheckoutCustomer, value: string) {
  const trimmed = value.trim();

  if (requiredCustomerFields.includes(key) && !trimmed) {
    return "Required";
  }

  if (key === "email" && trimmed && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return "Invalid email";
  }

  if (key === "pincode" && trimmed && !/^\d{6}$/.test(trimmed)) {
    return "Invalid PIN code";
  }

  if (key === "phone" && trimmed) {
    const digits = trimmed.replace(/\D/g, "");

    if (digits.length < 10 || digits.length > 15) {
      return "Invalid phone";
    }
  }

  if (key === "state" && trimmed && !indianStates.some((state) => state.code === trimmed)) {
    return "Select state";
  }

  return "";
}

function validateCheckoutCustomer(customer: CheckoutCustomer) {
  return (Object.keys(customer) as (keyof CheckoutCustomer)[]).reduce<CheckoutValidationErrors>((errors, key) => {
    const error = validateCheckoutField(key, customer[key]);

    if (error) {
      errors[key] = error;
    }

    return errors;
  }, {});
}

function getCheckoutItems(items: CheckoutPayload["items"]): CheckoutPayload["items"] {
  return items.map((item) => ({
    id: item.id,
    variationId: item.variationId,
    variationAttributes: item.variationAttributes,
    href: item.href,
    name: item.name,
    quantity: item.quantity
  }));
}

function buildCheckoutPayload(
  formData: FormData,
  items: CheckoutPayload["items"],
  discountCode?: string,
  shippingId?: string
): CheckoutPayload {
  return {
    items: getCheckoutItems(items),
    customer: {
      firstName: getFormString(formData, "firstName"),
      lastName: getFormString(formData, "lastName"),
      email: getFormString(formData, "email"),
      phone: getFormString(formData, "mobile"),
      country: getFormString(formData, "country") || "India",
      address1: getFormString(formData, "address1"),
      address2: getFormString(formData, "address2"),
      city: getFormString(formData, "city"),
      state: getFormString(formData, "state"),
      pincode: getFormString(formData, "pincode")
    },
    discountCode,
    shippingId
  };
}

const emptyCheckoutCustomer: CheckoutCustomer = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  country: "India",
  address1: "",
  address2: "",
  city: "",
  state: "",
  pincode: ""
};

function splitName(value: string) {
  const parts = value.trim().split(/\s+/).filter(Boolean);

  return {
    firstName: parts[0] ?? "",
    lastName: parts.slice(1).join(" ")
  };
}

function getCheckoutCustomerFromUser(user: AuthUser): CheckoutCustomer {
  const { email, phone } = getAuthUserContact(user);
  const { firstName, lastName } = splitName(user.name);

  return {
    ...emptyCheckoutCustomer,
    firstName,
    lastName,
    email,
    phone
  };
}

function mapAddressToCheckoutCustomer(
  address: WooAddress | undefined,
  fallback: CheckoutCustomer
): CheckoutCustomer {
  if (!address) {
    return fallback;
  }

  return {
    ...fallback,
    firstName: address.first_name?.trim() || fallback.firstName,
    lastName: address.last_name?.trim() || fallback.lastName,
    email: address.email?.trim() || fallback.email,
    phone: address.phone?.trim() || fallback.phone,
    country: "India",
    address1: address.address_1?.trim() || "",
    address2: address.address_2?.trim() || "",
    city: address.city?.trim() || "",
    state: normalizeIndianStateValue(address.state),
    pincode: address.postcode?.trim() || ""
  };
}

function hasShippingAddress(customer: CheckoutCustomer) {
  return Boolean(
    customer.country.trim() &&
    customer.address1.trim() &&
    customer.city.trim() &&
    customer.state.trim() &&
    customer.pincode.trim()
  );
}

function RequiredLabel({ htmlFor, children }: { htmlFor: string; children: string }) {
  return (
    <label htmlFor={htmlFor}>
      {children} <span className="checkout-required" aria-hidden="true">*</span>
    </label>
  );
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
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [customer, setCustomer] = useState<CheckoutCustomer>(emptyCheckoutCustomer);
  const [discountCode, setDiscountCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<CheckoutDiscount | null>(null);
  const [discountMessage, setDiscountMessage] = useState("");
  const [discountApplying, setDiscountApplying] = useState(false);
  const [shippingOptions, setShippingOptions] = useState<CheckoutShippingOption[]>([]);
  const [selectedShippingId, setSelectedShippingId] = useState("");
  const [shippingLoading, setShippingLoading] = useState(false);
  const [shippingError, setShippingError] = useState("");
  const [validationErrors, setValidationErrors] = useState<CheckoutValidationErrors>({});

  const discountAmount = Math.min(subtotal, appliedDiscount?.amount ?? 0);
  const selectedShipping = shippingOptions.find((option) => option.id === selectedShippingId) ?? shippingOptions[0];
  const shippingTotal = selectedShipping?.total ?? 0;
  const shippingAddressReady = hasShippingAddress(customer);
  const total = Math.max(0, subtotal - discountAmount + shippingTotal);

  useEffect(() => {
    const stored = window.localStorage.getItem(accountStorageKey);

    if (!stored) {
      setAuthReady(true);
      setAuthOpen(true);
      return;
    }

    try {
      const nextUser = normalizeStoredUser(JSON.parse(stored));

      if (nextUser) {
        setAuthUser(nextUser);
        setCustomer(getCheckoutCustomerFromUser(nextUser));
      } else {
        window.localStorage.removeItem(accountStorageKey);
      }
      setAuthOpen(!nextUser);
    } catch {
      window.localStorage.removeItem(accountStorageKey);
      setAuthOpen(true);
    } finally {
      setAuthReady(true);
    }
  }, []);

  useEffect(() => {
    if (!authUser) {
      setCustomer(emptyCheckoutCustomer);
      return;
    }

    const fallback = getCheckoutCustomerFromUser(authUser);
    setCustomer((current) => ({
      ...fallback,
      ...Object.fromEntries(
        Object.entries(current).filter(([, value]) => Boolean(String(value).trim()))
      )
    }) as CheckoutCustomer);

    const { email, phone } = getAuthUserContact(authUser);

    if (!email) {
      return;
    }

    const controller = new AbortController();

    async function loadSavedAddress() {
      try {
        const response = await fetch("/api/account/address", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode: "load",
            email,
            phone
          }),
          signal: controller.signal
        });
        const data = (await response.json()) as AccountAddressResponse;

        if (!response.ok) {
          return;
        }

        const savedAddress = data.defaultAddress === "shipping" ? data.shipping : data.billing;
        setCustomer(mapAddressToCheckoutCustomer(savedAddress, fallback));
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setCustomer(fallback);
        }
      }
    }

    void loadSavedAddress();

    return () => controller.abort();
  }, [authUser]);

  useEffect(() => {
    if (complete) {
      window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
    }
  }, [complete]);

  useEffect(() => {
    const pincode = customer.pincode.trim();

    if (!/^\d{6}$/.test(pincode)) {
      return;
    }

    const controller = new AbortController();

    async function loadPincodeAddress() {
      try {
        const response = await fetch(`https://pincode-two.vercel.app/api/pincode/${encodeURIComponent(pincode)}`, {
          signal: controller.signal
        });
        const data = (await response.json().catch(() => null)) as PincodeLookupResponse | null;

        if (!response.ok || !data) {
          return;
        }

        const nextCity = data.district?.trim() ?? "";
        const nextState = normalizeIndianStateValue(data.state);
        const nextCountry = data.country?.trim() || "India";

        if (!nextCity && !nextState) {
          return;
        }

        setCustomer((current) => {
          if (current.pincode.trim() !== pincode) {
            return current;
          }

          return {
            ...current,
            city: nextCity || current.city,
            state: nextState || current.state,
            country: nextCountry || current.country
          };
        });
        setValidationErrors((current) => {
          const next = { ...current };
          const updatedFields: Partial<CheckoutCustomer> = {
            city: nextCity,
            state: nextState,
            country: nextCountry
          };

          (Object.entries(updatedFields) as [keyof CheckoutCustomer, string][]).forEach(([key, value]) => {
            const error = validateCheckoutField(key, value);

            if (error) {
              next[key] = error;
            } else {
              delete next[key];
            }
          });

          return next;
        });
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          return;
        }
      }
    }

    void loadPincodeAddress();

    return () => controller.abort();
  }, [customer.pincode]);

  useEffect(() => {
    if (!authUser || items.length === 0) {
      setShippingOptions([]);
      setSelectedShippingId("");
      return;
    }

    if (!shippingAddressReady) {
      setShippingOptions([]);
      setSelectedShippingId("");
      setShippingError("");
      return;
    }

    const controller = new AbortController();

    async function loadShippingOptions() {
      setShippingLoading(true);
      setShippingError("");

      try {
        const response = await fetch("/api/checkout/shipping", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: getCheckoutItems(items),
            customer,
            discountCode: appliedDiscount?.code
          }),
          signal: controller.signal
        });
        const data = (await response.json()) as ShippingResponse;

        if (!response.ok) {
          throw new Error(data.error || "Could not load shipping methods.");
        }

        const nextOptions = data.options ?? [];
        setShippingOptions(nextOptions);
        setSelectedShippingId((current) => {
          if (nextOptions.some((option) => option.id === current)) {
            return current;
          }

          return nextOptions[0]?.id ?? "";
        });
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setShippingOptions([]);
        setSelectedShippingId("");
        setShippingError(error instanceof Error ? error.message : "Could not load shipping methods.");
      } finally {
        if (!controller.signal.aborted) {
          setShippingLoading(false);
        }
      }
    }

    void loadShippingOptions();

    return () => controller.abort();
  }, [appliedDiscount?.code, authUser, customer, items, shippingAddressReady]);

  const hasFieldError = (key: keyof CheckoutCustomer) => Boolean(validationErrors[key]);

  const updateCustomerField = (key: keyof CheckoutCustomer, value: string) => {
    setCustomer((current) => ({ ...current, [key]: value }));
    setValidationErrors((current) => {
      if (!current[key]) {
        return current;
      }

      const error = validateCheckoutField(key, value);
      const next = { ...current };

      if (error) {
        next[key] = error;
      } else {
        delete next[key];
      }

      return next;
    });
  };

  const handleAuthClose = useCallback(() => {
    setAuthOpen(false);
  }, []);

  const handleUserChange = useCallback((nextUser: AuthUser | null) => {
    setAuthUser(nextUser);
    if (nextUser) {
      setCustomer(getCheckoutCustomerFromUser(nextUser));
    }
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (paymentProcessing) {
      return;
    }

    const form = event.currentTarget;
    const formData = new FormData(form);
    const checkoutPayload = buildCheckoutPayload(
      formData,
      items,
      appliedDiscount?.code,
      selectedShipping?.id
    );
    const { firstName, lastName, email, phone } = checkoutPayload.customer;
    const name = `${firstName} ${lastName}`.trim();
    const nextValidationErrors = validateCheckoutCustomer(checkoutPayload.customer);
    const firstInvalidField = requiredCustomerFields.find((field) => nextValidationErrors[field]);

    setValidationErrors(nextValidationErrors);

    setPaymentError("");

    if (firstInvalidField) {
      form.querySelector<HTMLInputElement | HTMLSelectElement>(`[name="${firstInvalidField}"]`)?.focus();
      setPaymentError("Please complete the highlighted fields.");
      return;
    }

    if (shippingLoading) {
      setPaymentError("Shipping is still calculating. Please try again in a moment.");
      return;
    }

    if (!selectedShipping) {
      setPaymentError(shippingError || "Shipping is not available for this address.");
      return;
    }

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
          items: getCheckoutItems(items),
          customer: checkoutPayload.customer,
          discountCode: appliedDiscount?.code,
          shippingId: selectedShipping?.id
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
            email,
            contact: phone
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

  const handleApplyDiscount = async () => {
    const normalizedCode = discountCode.trim();

    if (!normalizedCode) {
      setAppliedDiscount(null);
      setDiscountMessage("Enter a discount code.");
      return;
    }

    setDiscountApplying(true);
    setDiscountMessage("");

    try {
      const response = await fetch("/api/checkout/discount", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: getCheckoutItems(items),
          discountCode: normalizedCode
        })
      });
      const data = (await response.json()) as DiscountResponse;

      if (!response.ok || !data.discount) {
        throw new Error(data.error || "Could not apply discount.");
      }

      setAppliedDiscount(data.discount);
      setDiscountCode(data.discount.code);
      setDiscountMessage(`${data.discount.code.toUpperCase()} applied.`);
    } catch (error) {
      setAppliedDiscount(null);
      setDiscountMessage(error instanceof Error ? error.message : "Could not apply discount.");
    } finally {
      setDiscountApplying(false);
    }
  };

  const clearDiscount = () => {
    setAppliedDiscount(null);
    setDiscountCode("");
    setDiscountMessage("");
  };

  return (
    <>
      <SiteHeader variant="solid" categories={categories} />
      <main className={`checkout-page shopify-checkout${complete ? " is-complete" : ""}`}>
        <div className="checkout-shell">
          <div className="checkout-main">
            <section className="checkout-brand-block" aria-labelledby="checkout-title">
              <h1 id="checkout-title">Checkout</h1>
            </section>

            {!authReady || !isHydrated ? (
              <section className="checkout-empty">
                <ShoppingBag size={32} aria-hidden="true" />
                <h2>Loading checkout</h2>
                <p>Loading account and cart.</p>
              </section>
            ) : !authUser ? (
              <section className="checkout-empty checkout-auth-gate">
                <LockKeyhole size={32} aria-hidden="true" />
                <h2>Login required</h2>
                <p>Sign in to continue to checkout and place your order.</p>
                <button type="button" onClick={() => setAuthOpen(true)}>
                  Login / Sign up
                </button>
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
              <form id="checkout-form" className="checkout-form" onSubmit={handleSubmit} noValidate>
                <section className="checkout-panel">
                  <div className="checkout-grid">
                    <div>
                      <RequiredLabel htmlFor="email">Email</RequiredLabel>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        value={customer.email}
                        onChange={(event) => updateCustomerField("email", event.target.value)}
                        autoComplete="email"
                        aria-invalid={hasFieldError("email")}
                        required
                      />
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
                      <RequiredLabel htmlFor="country">Country/Region</RequiredLabel>
                      <select
                        id="country"
                        name="country"
                        value={customer.country}
                        onChange={(event) => updateCustomerField("country", event.target.value)}
                        aria-invalid={hasFieldError("country")}
                        required
                      >
                        <option>India</option>
                      </select>
                    </div>
                  </div>
                  <div className="checkout-grid two-up">
                    <div>
                      <RequiredLabel htmlFor="first-name">First name</RequiredLabel>
                      <input
                        id="first-name"
                        name="firstName"
                        type="text"
                        value={customer.firstName}
                        onChange={(event) => updateCustomerField("firstName", event.target.value)}
                        aria-invalid={hasFieldError("firstName")}
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="last-name">Last name</label>
                      <input
                        id="last-name"
                        name="lastName"
                        type="text"
                        value={customer.lastName}
                        onChange={(event) => updateCustomerField("lastName", event.target.value)}
                        aria-invalid={hasFieldError("lastName")}
                      />
                    </div>
                  </div>
                  <div className="checkout-grid">
                    <div>
                      <RequiredLabel htmlFor="address1">Address</RequiredLabel>
                      <input
                        id="address1"
                        name="address1"
                        type="text"
                        value={customer.address1}
                        onChange={(event) => updateCustomerField("address1", event.target.value)}
                        aria-invalid={hasFieldError("address1")}
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="address2">Apartment, suite</label>
                      <input
                        id="address2"
                        name="address2"
                        type="text"
                        value={customer.address2}
                        onChange={(event) => updateCustomerField("address2", event.target.value)}
                        aria-invalid={hasFieldError("address2")}
                      />
                    </div>
                  </div>
                  <div className="checkout-grid three-up">
                    <div>
                      <RequiredLabel htmlFor="pincode">PIN code</RequiredLabel>
                      <input
                        id="pincode"
                        name="pincode"
                        type="text"
                        value={customer.pincode}
                        onChange={(event) => updateCustomerField("pincode", event.target.value)}
                        aria-invalid={hasFieldError("pincode")}
                        inputMode="numeric"
                        maxLength={6}
                        required
                      />
                    </div>
                    <div>
                      <RequiredLabel htmlFor="city">City</RequiredLabel>
                      <input
                        id="city"
                        name="city"
                        type="text"
                        value={customer.city}
                        onChange={(event) => updateCustomerField("city", event.target.value)}
                        aria-invalid={hasFieldError("city")}
                        required
                      />
                    </div>
                    <div>
                      <RequiredLabel htmlFor="state">State</RequiredLabel>
                      <select
                        id="state"
                        name="state"
                        value={normalizeIndianStateValue(customer.state)}
                        onChange={(event) => updateCustomerField("state", event.target.value)}
                        aria-invalid={hasFieldError("state")}
                        required
                      >
                        <option value="">Select state</option>
                        {indianStates.map((state) => (
                          <option key={state.code} value={state.code}>
                            {state.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="checkout-grid">
                    <div>
                      <RequiredLabel htmlFor="mobile">Phone</RequiredLabel>
                      <input
                        id="mobile"
                        name="mobile"
                        type="tel"
                        value={customer.phone}
                        onChange={(event) => updateCustomerField("phone", event.target.value)}
                        aria-invalid={hasFieldError("phone")}
                        required
                      />
                    </div>
                  </div>
                  <label className="checkout-checkline">
                    <input type="checkbox" />
                    <span>Save info</span>
                  </label>
                </section>


              </form>
            ) : (
              <section className="checkout-empty">
                <ShoppingBag size={32} aria-hidden="true" />
                <h2>Loading checkout</h2>
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
                        <small>
                          {item.variationAttributes?.length
                            ? item.variationAttributes.map((attribute) => `${attribute.name}: ${attribute.option}`).join(" / ")
                            : item.tag ?? "IronRoot"}
                        </small>
                      </div>
                      <span>{currencyFormatter.format(linePrice)}</span>
                    </div>
                  );
                })}
              </div>

              <div className="checkout-discount">
                <label htmlFor="discount-code">Discount code or gift card</label>
                <div className="checkout-discount-entry">
                  <Tag size={16} aria-hidden="true" />
                  <input
                    id="discount-code"
                    type="text"
                    value={discountCode}
                    onChange={(event) => {
                      setDiscountCode(event.target.value.toUpperCase());
                      if (appliedDiscount) {
                        setAppliedDiscount(null);
                      }
                      setDiscountMessage("");
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        void handleApplyDiscount();
                      }
                    }}
                  />
                  <button type="button" onClick={handleApplyDiscount} disabled={discountApplying || itemCount === 0}>
                    {discountApplying ? "Applying" : "Apply"}
                  </button>
                </div>
                {discountMessage || appliedDiscount ? (
                  <div className="checkout-discount-feedback">
                    {discountMessage ? (
                      <p className={`checkout-discount-message${appliedDiscount ? " is-success" : ""}`}>
                        {discountMessage}
                      </p>
                    ) : null}
                    {appliedDiscount ? (
                      <button className="checkout-discount-remove" type="button" onClick={clearDiscount}>
                        <X size={14} aria-hidden="true" />
                        Remove {appliedDiscount.code.toUpperCase()}
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </div>

              <div className="checkout-summary-lines">
                <div>
                  <span>Subtotal</span>
                  <strong>{currencyFormatter.format(subtotal)}</strong>
                </div>
                {discountAmount > 0 ? (
                  <div className="is-discount">
                    <span>Discount</span>
                    <strong>-{currencyFormatter.format(discountAmount)}</strong>
                  </div>
                ) : null}
                <div>
                  <span>Shipping</span>
                  <strong>
                    {shippingLoading
                      ? "Calculating"
                        : selectedShipping
                          ? shippingTotal > 0
                            ? currencyFormatter.format(shippingTotal)
                            : "Free"
                        : shippingAddressReady
                          ? "Not available"
                          : "Enter address"}
                  </strong>
                </div>
                <div>
                  <span>Taxes</span>
                  <strong>Inclusive of all taxes</strong>
                </div>
                <div className="is-total">
                  <span>Total</span>
                  <strong>{currencyFormatter.format(total)}</strong>
                </div>
              </div>


              <div className="checkout-actions">
                <button
                  className="checkout-submit"
                  type="submit"
                  form="checkout-form"
                >
                  <LockKeyhole size={16} aria-hidden="true" />
                  {paymentProcessing ? "Opening Razorpay..." : "Pay securely with Razorpay"}
                </button>
                {paymentError ? (
                  <p className="checkout-payment-error" role="alert">
                    {paymentError}
                  </p>
                ) : null}

                <a href="/all-products">Return to shopping</a>
              </div>
            </aside>
          ) : null}
        </div>
      </main>
      <AccountOtpModal
        open={authOpen && !authUser}
        onClose={handleAuthClose}
        onUserChange={handleUserChange}
        redirectTo="/checkout"
      />
    </>
  );
}
