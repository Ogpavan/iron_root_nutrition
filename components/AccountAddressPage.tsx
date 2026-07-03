"use client";

import { ArrowLeft, Home, Pencil, Plus, Save, Truck, X } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import SiteHeader from "@/components/SiteHeader";
import {
  accountStorageKey,
  getAuthUserContact,
  normalizeStoredUser,
  type AuthUser
} from "@/lib/account-auth";
import type { WooCatalogCategory } from "@/lib/woocommerce";

type AccountAddressPageProps = {
  categories: WooCatalogCategory[];
};

type AddressKind = "billing" | "shipping";

type AddressForm = {
  first_name: string;
  last_name: string;
  company: string;
  address_1: string;
  address_2: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
  email: string;
  phone: string;
};

const emptyAddress: AddressForm = {
  first_name: "",
  last_name: "",
  company: "",
  address_1: "",
  address_2: "",
  city: "",
  state: "",
  postcode: "",
  country: "IN",
  email: "",
  phone: ""
};

function splitName(value: string) {
  const parts = value.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return { firstName: "", lastName: "" };
  }

  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" ")
  };
}

function mergeAddress(value: Partial<AddressForm> | undefined, fallback: Partial<AddressForm>) {
  return {
    ...emptyAddress,
    ...fallback,
    ...value
  };
}

export default function AccountAddressPage({ categories }: AccountAddressPageProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [billing, setBilling] = useState<AddressForm>(emptyAddress);
  const [shipping, setShipping] = useState<AddressForm>(emptyAddress);
  const [defaultAddress, setDefaultAddress] = useState<AddressKind>("billing");
  const [formOpen, setFormOpen] = useState(false);
  const [editingKind, setEditingKind] = useState<AddressKind>("billing");

  const contact = useMemo(() => (user ? getAuthUserContact(user) : { email: "", phone: "" }), [user]);

  useEffect(() => {
    const stored = window.localStorage.getItem(accountStorageKey);

    if (!stored) {
      setAuthReady(true);
      return;
    }

    try {
      const parsed = normalizeStoredUser(JSON.parse(stored));

      if (parsed) {
        setUser(parsed);
      } else {
        window.localStorage.removeItem(accountStorageKey);
      }
    } catch {
      window.localStorage.removeItem(accountStorageKey);
    }

    setAuthReady(true);
  }, []);

  useEffect(() => {
    if (!user || !contact.email) {
      return;
    }

    const currentUser = user;
    const controller = new AbortController();

    async function loadAddress() {
      setLoading(true);
      setMessage("");

      try {
        const response = await fetch("/api/account/address", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode: "load",
            email: contact.email,
            phone: contact.phone
          }),
          signal: controller.signal
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Could not load saved address.");
        }

        const { firstName, lastName } = splitName(currentUser.name);
        const fallback = {
          first_name: firstName,
          last_name: lastName,
          email: contact.email,
          phone: contact.phone
        };

        setBilling(mergeAddress(data.billing, fallback));
        setShipping(mergeAddress(data.shipping, fallback));
        setDefaultAddress(data.defaultAddress === "shipping" ? "shipping" : "billing");
      } catch (error) {
        if (!controller.signal.aborted) {
          setMessage(error instanceof Error ? error.message : "Could not load saved address.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadAddress();

    return () => controller.abort();
  }, [contact.email, contact.phone, user]);

  useEffect(() => {
    if (!formOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setFormOpen(false);
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [formOpen]);

  const updateAddress = (kind: AddressKind, key: keyof AddressForm, value: string) => {
    const setter = kind === "billing" ? setBilling : setShipping;

    setter((current) => ({ ...current, [key]: value }));
  };

  const copyBillingToShipping = () => {
    setShipping({ ...billing });
    setMessage("Billing address copied to shipping.");
  };

  const saveAddress = async (nextDefaultAddress = defaultAddress) => {
    if (!user || !contact.email) {
      setMessage("Add an email address to your profile before saving a WordPress address.");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const response = await fetch("/api/account/address", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "save",
          name: user.name,
          email: contact.email,
          phone: contact.phone,
          billing,
          shipping,
          defaultAddress: nextDefaultAddress
        })
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not save address.");
      }

      setBilling(mergeAddress(data.billing, billing));
      setShipping(mergeAddress(data.shipping, shipping));
      setDefaultAddress(data.defaultAddress === "shipping" ? "shipping" : "billing");
      setMessage("Saved to WordPress customer address.");
      setFormOpen(false);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save address.");
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await saveAddress();
  };

  const hasAddress = (values: AddressForm) =>
    Boolean(
      values.first_name ||
      values.last_name ||
      values.address_1 ||
      values.address_2 ||
      values.city ||
      values.state ||
      values.postcode ||
      values.phone
    );

  const addressRows = [
    { kind: "billing" as const, title: "Billing address", values: billing, Icon: Home },
    { kind: "shipping" as const, title: "Shipping address", values: shipping, Icon: Truck }
  ].filter((item) => hasAddress(item.values));

  const openAddressForm = (kind?: AddressKind) => {
    const nextKind = kind ?? (!hasAddress(billing) ? "billing" : "shipping");

    setEditingKind(nextKind);
    setFormOpen(true);
    setMessage("");
  };

  const setAddressAsDefault = async (kind: AddressKind) => {
    setDefaultAddress(kind);
    await saveAddress(kind);
  };

  const renderAddressText = (values: AddressForm) => {
    const name = [values.first_name, values.last_name].filter(Boolean).join(" ");
    const street = [values.address_1, values.address_2].filter(Boolean).join(", ");
    const location = [values.city, values.state, values.postcode].filter(Boolean).join(", ");
    const country = values.country ? values.country.toUpperCase() : "";
    const contactLine = [values.phone, values.email].filter(Boolean).join(" | ");

    return (
      <>
        <strong>{name || "Saved address"}</strong>
        {street ? <span>{street}</span> : null}
        {location || country ? <span>{[location, country].filter(Boolean).join(", ")}</span> : null}
        {contactLine ? <em>{contactLine}</em> : null}
      </>
    );
  };

  const renderAddressFields = (kind: AddressKind, title: string) => {
    const Icon = kind === "billing" ? Home : Truck;
    const values = kind === "billing" ? billing : shipping;

    return (
      <section className="address-panel" aria-labelledby={`${kind}-address-title`}>
        <div className="address-panel-header">
          <span>
            <Icon size={20} aria-hidden="true" />
          </span>
          <div>
            <h2 id={`${kind}-address-title`}>{title}</h2>
            <p>{kind === defaultAddress ? "Default address" : "Saved in WordPress"}</p>
          </div>
          <label className="address-default-toggle">
            <input
              type="radio"
              name="defaultAddress"
              checked={defaultAddress === kind}
              onChange={() => setDefaultAddress(kind)}
            />
            Default
          </label>
        </div>

        <div className="address-form-grid">
          <label>
            First name
            <input
              value={values.first_name}
              onChange={(event) => updateAddress(kind, "first_name", event.target.value)}
              required={kind === defaultAddress}
            />
          </label>
          <label>
            Last name
            <input
              value={values.last_name}
              onChange={(event) => updateAddress(kind, "last_name", event.target.value)}
            />
          </label>
          <label className="address-wide">
            Address line 1
            <input
              value={values.address_1}
              onChange={(event) => updateAddress(kind, "address_1", event.target.value)}
              required={kind === defaultAddress}
            />
          </label>
          <label className="address-wide">
            Apartment, suite
            <input
              value={values.address_2}
              onChange={(event) => updateAddress(kind, "address_2", event.target.value)}
            />
          </label>
          <label>
            City
            <input
              value={values.city}
              onChange={(event) => updateAddress(kind, "city", event.target.value)}
              required={kind === defaultAddress}
            />
          </label>
          <label>
            State
            <input
              value={values.state}
              onChange={(event) => updateAddress(kind, "state", event.target.value)}
              required={kind === defaultAddress}
            />
          </label>
          <label>
            Pincode
            <input
              value={values.postcode}
              onChange={(event) => updateAddress(kind, "postcode", event.target.value)}
              required={kind === defaultAddress}
            />
          </label>
          <label>
            Country
            <input
              value={values.country}
              onChange={(event) => updateAddress(kind, "country", event.target.value.toUpperCase())}
              required={kind === defaultAddress}
            />
          </label>
          <label>
            Email
            <input
              type="email"
              value={values.email}
              onChange={(event) => updateAddress(kind, "email", event.target.value)}
            />
          </label>
          <label>
            Phone
            <input
              type="tel"
              value={values.phone}
              onChange={(event) => updateAddress(kind, "phone", event.target.value)}
            />
          </label>
        </div>
      </section>
    );
  };

  if (!authReady) {
    return (
      <>
        <SiteHeader variant="solid" categories={categories} />
        <main className="account-page">
          <section className="account-auth-loading" aria-live="polite">
            <span aria-label="Loading account" />
          </section>
        </main>
      </>
    );
  }

  return (
    <>
      <SiteHeader variant="solid" categories={categories} />
      <main className="account-page">
        <section className="address-shell" aria-labelledby="address-list-title">
          <a href="/account" className="address-back-link">
            <ArrowLeft size={17} aria-hidden="true" />
            Account
          </a>

          {!user ? (
            <section className="address-empty">
              <h2>Login required</h2>
              <p>Login or sign up before managing your saved address.</p>
              <a href="/account">Go to account</a>
            </section>
          ) : (
            <div className="address-form">
              {loading ? <p className="address-status">Loading saved address...</p> : null}
              {message ? <p className="address-status">{message}</p> : null}

              <div className="address-list-head">
                <div>
                  <h2 id="address-list-title">Saved addresses</h2>
                  <p>{addressRows.length ? `${addressRows.length} address${addressRows.length === 1 ? "" : "es"} saved` : "No saved address yet"}</p>
                </div>
                <button type="button" onClick={() => openAddressForm()} disabled={saving || !contact.email}>
                  <Plus size={17} aria-hidden="true" />
                  Add new address
                </button>
              </div>

              {addressRows.length ? (
                <div className="address-list">
                  {addressRows.map(({ kind, title, values, Icon }) => (
                    <article className="address-row" key={kind}>
                      <span className="address-row-icon">
                        <Icon size={19} aria-hidden="true" />
                      </span>
                      <div className="address-row-main">
                        <div className="address-row-title">
                          <h3>{title}</h3>
                          {kind === defaultAddress ? <mark>Default</mark> : null}
                        </div>
                        <p>{renderAddressText(values)}</p>
                      </div>
                      <div className="address-row-actions">
                        <button
                          type="button"
                          onClick={() => setAddressAsDefault(kind)}
                          disabled={saving || kind === defaultAddress}
                        >
                          {kind === defaultAddress ? "Default" : "Set default"}
                        </button>
                        <button type="button" onClick={() => openAddressForm(kind)}>
                          <Pencil size={16} aria-hidden="true" />
                          Edit
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              ) : null}

            </div>
          )}
        </section>
      </main>
      {formOpen ? (
        <div
          className="address-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="address-modal-title"
        >
          <button
            className="address-modal-backdrop"
            type="button"
            aria-label="Close address form"
            onClick={() => setFormOpen(false)}
          />
          <form className="address-modal-panel" onSubmit={handleSubmit}>
            <div className="address-modal-head">
              <div>
                <p>{editingKind === "billing" ? "Billing" : "Shipping"}</p>
                <h2 id="address-modal-title">
                  {hasAddress(editingKind === "billing" ? billing : shipping)
                    ? "Edit address"
                    : "Add new address"}
                </h2>
              </div>
              <button type="button" aria-label="Close address form" onClick={() => setFormOpen(false)}>
                <X size={19} aria-hidden="true" />
              </button>
            </div>

            <div className="address-modal-body">
              {renderAddressFields(
                editingKind,
                editingKind === "billing" ? "Billing address" : "Shipping address"
              )}
            </div>

            <div className="address-actions address-modal-actions">
              {editingKind === "shipping" ? (
                <button type="button" onClick={copyBillingToShipping}>
                  Copy billing to shipping
                </button>
              ) : null}
              <button type="button" onClick={() => setFormOpen(false)}>
                Cancel
              </button>
              <button type="submit" disabled={saving || !contact.email}>
                <Save size={17} aria-hidden="true" />
                {saving ? "Saving" : "Save address"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </>
  );
}
