"use client";

import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  Check,
  Crown,
  Dumbbell,
  LogOut,
  Mail,
  MapPin,
  Package,
  Pencil,
  Phone,
  ShieldCheck,
  Smartphone,
  UserRound,
  X,
  Zap
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import SiteHeader from "@/components/SiteHeader";
import {
  accountStorageKey,
  getAccountInitials,
  isValidAuthEmail,
  normalizeAuthEmail,
  normalizeStoredUser,
  type AuthUser
} from "@/lib/account-auth";
import type { WooCatalogCategory } from "@/lib/woocommerce";

type AccountOtpPageProps = {
  categories: WooCatalogCategory[];
};

const profileProductImage =
  "https://admin.ironrootnutrition.com/wp-content/uploads/2026/06/ChatGPT-Image-Jun-16-2026-05_46_03-PM.png";

const secondaryProfileMetrics = [
  {
    label: "Saved Address",
    value: "Address",
    action: "Manage",
    href: "/account/address",
    icon: MapPin
  },
  {
    label: "Support",
    value: "Help",
    action: "Contact support",
    href: "/support",
    icon: Smartphone
  },
  {
    label: "Shop Again",
    value: "Products",
    action: "Browse",
    href: "/all-products",
    icon: Dumbbell
  }
];

const profileAssurances = [
  {
    title: "100% Authentic",
    text: "Genuine IronRoot products",
    icon: ShieldCheck
  },
  {
    title: "Expert Nutrition",
    text: "Backed by science & results",
    icon: Dumbbell
  },
  {
    title: "Performance Driven",
    text: "Fuel your best self",
    icon: Zap
  },
  {
    title: "Trusted by Athletes",
    text: "Across India & beyond",
    icon: BadgeCheck
  }
];

function createOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function hasUsablePhone(value: string) {
  return value.replace(/\D/g, "").length >= 7;
}

function getValidDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function formatProfileDate(date: Date) {
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  });
}

export default function AccountOtpPage({ categories }: AccountOtpPageProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [otp, setOtp] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [step, setStep] = useState<"identity" | "verify">("identity");
  const [message, setMessage] = useState("");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [profilePhone, setProfilePhone] = useState("");
  const [profileMessage, setProfileMessage] = useState("");

  const resetProfileDraft = (nextUser: AuthUser) => {
    setProfileName(nextUser.name);
    setProfileEmail(nextUser.email ?? nextUser.identifier);
    setProfilePhone(nextUser.phone ?? "");
  };

  const closeProfileEditor = () => {
    setIsEditingProfile(false);
    setProfileMessage("");

    if (user) {
      resetProfileDraft(user);
    }
  };

  useEffect(() => {
    const stored = window.localStorage.getItem(accountStorageKey);

    if (!stored) {
      setAuthReady(true);
      return;
    }

    try {
      const storedUser = normalizeStoredUser(JSON.parse(stored));

      if (storedUser) {
        setUser(storedUser);
      } else {
        window.localStorage.removeItem(accountStorageKey);
      }
    } catch {
      window.localStorage.removeItem(accountStorageKey);
    } finally {
      setAuthReady(true);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      setIsEditingProfile(false);
      setProfileName("");
      setProfileEmail("");
      setProfilePhone("");
      setProfileMessage("");
      return;
    }

    resetProfileDraft(user);
  }, [user]);

  useEffect(() => {
    if (!isEditingProfile) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeProfileEditor();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isEditingProfile, user]);

  const handleRequestOtp = (event: FormEvent<HTMLFormElement>) => {
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
      identifier: normalizeAuthEmail(identifier),
      email: normalizeAuthEmail(identifier),
      signedInAt: new Date().toISOString()
    };

    window.localStorage.setItem(accountStorageKey, JSON.stringify(nextUser));
    setUser(nextUser);
    setMessage("You are signed in.");
  };

  const handleProfileSave = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!user) {
      return;
    }

    const nextName = profileName.trim();
    const nextEmail = normalizeAuthEmail(profileEmail);
    const nextPhone = profilePhone.trim();

    if (nextName.length < 2) {
      setProfileMessage("Enter a valid full name.");
      return;
    }

    if (!isValidAuthEmail(nextEmail)) {
      setProfileMessage("Enter a valid email address.");
      return;
    }

    if (nextPhone && !hasUsablePhone(nextPhone)) {
      setProfileMessage("Enter a valid phone number.");
      return;
    }

    const nextUser: AuthUser = {
      ...user,
      name: nextName,
      identifier: nextEmail,
      email: nextEmail,
      phone: nextPhone || undefined
    };

    window.localStorage.setItem(accountStorageKey, JSON.stringify(nextUser));
    setUser(nextUser);
    setIsEditingProfile(false);
    setProfileMessage("Profile updated.");
  };

  const handleSignOut = () => {
    window.localStorage.removeItem(accountStorageKey);
    setUser(null);
    setName("");
    setIdentifier("");
    setOtp("");
    setGeneratedOtp("");
    setStep("identity");
    setMessage("");
  };

  const signedInDate = user ? getValidDate(user.signedInAt) : new Date();
  const emailAddress = user ? user.email ?? user.identifier : "";
  const phoneNumber = user ? user.phone ?? "Not added" : "";
  const detailRows = user
    ? [
        { label: "Full Name", value: user.name, icon: UserRound },
        { label: "Email Address", value: emailAddress, icon: Mail },
        { label: "Member Since", value: formatProfileDate(signedInDate), icon: CalendarDays },
        {
          label: "Phone Number",
          value: phoneNumber,
          icon: Phone
        }
      ]
    : [];
  const profileMetrics = [
    {
      label: "Orders",
      value: "View",
      action: "View all orders",
      href: "/account/orders",
      icon: Package
    },
    ...secondaryProfileMetrics
  ];

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
        {user ? (
          <section className="profile-shell profile-dashboard" aria-labelledby="profile-title">
            <section className="profile-hero" aria-label="IronRoot member profile">
              <div className="profile-identity">
                <span className="profile-avatar" aria-hidden="true">
                  {getAccountInitials(user)}
                </span>
                <div className="profile-identity-copy">
                  <p>IronRoot profile</p>
                  <h1 id="profile-title">{user.name}</h1>
                  <span>{user.identifier}</span>
                </div>
              </div>

              <div className="profile-gear-showcase" aria-hidden="true">
                <span className="profile-slash profile-slash-one" />
                <span className="profile-slash profile-slash-two" />
                <span className="profile-dust" />
                <Image
                  src={profileProductImage}
                  alt=""
                  fill
                  priority
                  sizes="(max-width: 1100px) 100vw, 620px"
                  className="profile-product-image"
                />
              </div>
            </section>

            <div className="profile-metrics-grid" aria-label="Account summary">
              {profileMetrics.map((item) => {
                const Icon = item.icon;
                const isOrdersMetric = item.label === "Orders";

                return (
                  <a
                    className="profile-metric-card"
                    href={item.href}
                    key={item.label}
                    onClick={
                      isOrdersMetric
                        ? (event) => {
                            event.preventDefault();
                            router.push("/account/orders");
                          }
                        : undefined
                    }
                  >
                    <span className="profile-metric-icon">
                      <Icon size={27} aria-hidden="true" />
                    </span>
                    <span className="profile-metric-copy">
                      <em>{item.label}</em>
                      <strong>{item.value}</strong>
                    </span>
                    <span className="profile-metric-action">
                      {item.action}
                      <ArrowRight size={15} aria-hidden="true" />
                    </span>
                  </a>
                );
              })}
            </div>

            <div className="profile-grid">
              <section className="profile-card profile-details-card" aria-label="Profile details">
                <div className="profile-card-title">
                  <span>
                    <UserRound size={22} aria-hidden="true" />
                  </span>
                  <h2>Profile details</h2>
                  <button
                    className="profile-edit-button"
                    type="button"
                    aria-haspopup="dialog"
                    aria-expanded={isEditingProfile}
                    onClick={() => {
                      resetProfileDraft(user);
                      setIsEditingProfile(true);
                      setProfileMessage("");
                    }}
                  >
                    <Pencil size={15} aria-hidden="true" />
                    Edit profile
                  </button>
                </div>
                <dl className="profile-details">
                  {detailRows.map((row) => {
                    const Icon = row.icon;
                    return (
                      <div className="profile-detail-row" key={row.label}>
                        <span className="profile-detail-icon">
                          <Icon size={19} aria-hidden="true" />
                        </span>
                        <dt>{row.label}</dt>
                        <dd>{row.value}</dd>
                      </div>
                    );
                  })}
                </dl>
                {profileMessage ? <p className="profile-edit-message">{profileMessage}</p> : null}
              </section>

              <section className="profile-card profile-status-card" aria-label="Account status">
                <div className="profile-card-title">
                  <span>
                    <Crown size={22} aria-hidden="true" />
                  </span>
                  <h2>Account status</h2>
                </div>
                <div className="profile-status-panel">
                  <span>
                    <Check size={18} aria-hidden="true" />
                  </span>
                  <div>
                    <strong>Your account is active</strong>
                    <p>You are signed in on this device.</p>
                  </div>
                </div>
                <button className="profile-signout" type="button" onClick={handleSignOut}>
                  <LogOut size={18} aria-hidden="true" />
                  Sign out
                </button>
              </section>
            </div>

            {isEditingProfile ? (
              <div
                className="profile-edit-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="profile-edit-title"
              >
                <button
                  className="profile-edit-backdrop"
                  type="button"
                  aria-label="Close profile editor"
                  onClick={closeProfileEditor}
                />
                <div className="profile-edit-panel">
                  <button
                    className="profile-edit-close"
                    type="button"
                    aria-label="Close profile editor"
                    onClick={closeProfileEditor}
                  >
                    <X size={18} aria-hidden="true" />
                  </button>
                  <div className="profile-edit-head">
                    <span>
                      <UserRound size={22} aria-hidden="true" />
                    </span>
                    <div>
                      <p>Profile details</p>
                      <h2 id="profile-edit-title">Edit profile</h2>
                    </div>
                  </div>
                  <form className="profile-edit-form" onSubmit={handleProfileSave}>
                    <label htmlFor="profile-name">Full name</label>
                    <input
                      id="profile-name"
                      value={profileName}
                      onChange={(event) => setProfileName(event.target.value)}
                      autoComplete="name"
                    />
                    <label htmlFor="profile-email">Email address</label>
                    <input
                      id="profile-email"
                      type="email"
                      value={profileEmail}
                      onChange={(event) => setProfileEmail(event.target.value)}
                      placeholder="Add email address"
                      autoComplete="email"
                    />
                    <label htmlFor="profile-phone">Phone number</label>
                    <input
                      id="profile-phone"
                      type="tel"
                      value={profilePhone}
                      onChange={(event) => setProfilePhone(event.target.value)}
                      placeholder="Add phone number"
                      autoComplete="tel"
                      inputMode="tel"
                    />
                    <div className="profile-edit-actions">
                      <button type="submit">Save changes</button>
                      <button
                        className="profile-edit-cancel"
                        type="button"
                        onClick={closeProfileEditor}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                  {profileMessage ? (
                    <p className="profile-edit-message" role="alert">
                      {profileMessage}
                    </p>
                  ) : null}
                </div>
              </div>
            ) : null}

            <div className="profile-assurance-strip" aria-label="IronRoot assurance">
              {profileAssurances.map((item) => {
                const Icon = item.icon;
                return (
                  <div className="profile-assurance-item" key={item.title}>
                    <span>
                      <Icon size={26} aria-hidden="true" />
                    </span>
                    <div>
                      <strong>{item.title}</strong>
                      <em>{item.text}</em>
                    </div>
                  </div>
                );
              })}
              <strong className="profile-fuel-mark">
                <span>Fuel your</span>
                Best
              </strong>
            </div>
          </section>
        ) : (
          <section className="account-shell" aria-labelledby="account-title">
            <div className="account-copy">
              <p>IronRoot account</p>
              <h1 id="account-title">Login / Sign up</h1>
              <span>Use one OTP flow for new and returning customers.</span>
            </div>

            <div className="account-card">
              <div className="account-card-head">
                <ShieldCheck size={28} aria-hidden="true" />
                <div>
                  <h2>OTP verification</h2>
                  <p>No password needed.</p>
                </div>
              </div>

              {step === "identity" ? (
                <form className="account-form" onSubmit={handleRequestOtp}>
                  <label htmlFor="account-name">Full name</label>
                  <input
                    id="account-name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Enter your name"
                    autoComplete="name"
                    required
                  />
                  <label htmlFor="account-identifier">Email address</label>
                  <div className="account-input-wrap">
                    <Mail size={18} aria-hidden="true" />
                    <input
                      id="account-identifier"
                      type="email"
                      value={identifier}
                      onChange={(event) => setIdentifier(event.target.value)}
                      placeholder="Enter email address"
                      autoComplete="email"
                      required
                    />
                  </div>
                  <button type="submit">Send OTP</button>
                </form>
              ) : (
                <form className="account-form" onSubmit={handleVerifyOtp}>
                  <label htmlFor="account-otp">Enter OTP</label>
                  <input
                    id="account-otp"
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
                    Change email
                  </button>
                </form>
              )}

              {message ? <p className="account-message">{message}</p> : null}
            </div>
          </section>
        )}
      </main>
    </>
  );
}
