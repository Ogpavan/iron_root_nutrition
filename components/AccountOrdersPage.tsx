"use client";

import { ArrowLeft, Headphones, Package, RotateCcw, Search, Truck } from "lucide-react";
import { useEffect, useState } from "react";
import SiteHeader from "@/components/SiteHeader";
import {
  accountStorageKey,
  getAuthUserContact,
  normalizeStoredUser,
  type AuthUser
} from "@/lib/account-auth";
import type { WooCatalogCategory } from "@/lib/woocommerce";

type AccountOrdersPageProps = {
  categories: WooCatalogCategory[];
};

type AccountOrder = {
  id: number;
  number: string;
  status: string;
  statusLabel: string;
  dateCreated?: string;
  total: string;
  paymentMethod: string;
  items: {
    id?: number;
    productId?: number;
    name: string;
    quantity: number;
    total: string;
    image?: string;
  }[];
};

type OrderStatusBucket = "active" | "completed" | "cancelled";

function getValidDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function formatOrderDate(value?: string) {
  if (!value) {
    return "Date unavailable";
  }

  return getValidDate(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  });
}

function getOrderBucket(status: string): OrderStatusBucket {
  const normalized = status.toLowerCase();

  if (["cancelled", "refunded", "failed"].includes(normalized)) {
    return "cancelled";
  }

  if (["completed", "delivered"].includes(normalized)) {
    return "completed";
  }

  return "active";
}

function getStatusText(order: AccountOrder) {
  const bucket = getOrderBucket(order.status);

  if (bucket === "completed") {
    return "Delivered";
  }

  if (bucket === "cancelled") {
    return order.statusLabel;
  }

  return order.statusLabel || "In progress";
}

export default function AccountOrdersPage({ categories }: AccountOrdersPageProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [orders, setOrders] = useState<AccountOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState("");

  useEffect(() => {
    const stored = window.localStorage.getItem(accountStorageKey);

    if (!stored) {
      setAuthReady(true);
      setOrdersLoading(false);
      return;
    }

    try {
      const storedUser = normalizeStoredUser(JSON.parse(stored));

      if (storedUser) {
        setUser(storedUser);
      } else {
        window.localStorage.removeItem(accountStorageKey);
        setOrdersLoading(false);
      }
    } catch {
      window.localStorage.removeItem(accountStorageKey);
      setOrdersLoading(false);
    } finally {
      setAuthReady(true);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      return;
    }

    const controller = new AbortController();

    const loadOrders = async () => {
      setOrdersLoading(true);
      setOrdersError("");

      try {
        const response = await fetch("/api/account/orders", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(getAuthUserContact(user)),
          signal: controller.signal
        });
        const data = (await response.json()) as { orders?: AccountOrder[]; error?: string };

        if (!response.ok) {
          throw new Error(data.error || "Could not load order history.");
        }

        setOrders(data.orders ?? []);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setOrdersError(error instanceof Error ? error.message : "Could not load order history.");
      } finally {
        setOrdersLoading(false);
      }
    };

    void loadOrders();

    return () => controller.abort();
  }, [user]);

  return (
    <>
      <SiteHeader variant="solid" categories={categories} />
      <main className="account-page">
        <section className="profile-shell profile-dashboard" aria-labelledby="account-orders-title">
          <div className="profile-orders-toolbar">
            <a href="/account">
              <ArrowLeft size={18} aria-hidden="true" />
              Back to profile
            </a>
          </div>
          <section className="profile-orders-panel profile-orders-page-panel">
            <div className="profile-card-title">
              <span>
                <Package size={22} aria-hidden="true" />
              </span>
              <div>
                <p>IronRoot account</p>
                <h1 id="account-orders-title">My orders</h1>
              </div>
            </div>

            {!authReady ? (
              <div className="account-auth-loading" aria-live="polite">
                <span aria-label="Loading account" />
              </div>
            ) : !user ? (
              <p className="profile-orders-state">
                Sign in to your IronRoot account to view previous orders.
              </p>
            ) : ordersLoading ? (
              <p className="profile-orders-state">Loading your orders...</p>
            ) : ordersError ? (
              <p className="profile-orders-state" role="alert">
                {ordersError}
              </p>
            ) : orders.length === 0 ? (
              <div className="profile-orders-empty">
                <Search size={34} aria-hidden="true" />
                <h2>No orders found</h2>
                <p>No previous orders were found for this account email.</p>
                <a href="/all-products">Start shopping</a>
              </div>
            ) : (
              <div className="profile-orders-list">
                {orders.map((order) => {
                  const statusBucket = getOrderBucket(order.status);
                  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
                  const previewItems = order.items.slice(0, 3);

                  return (
                    <article className={`profile-order-card is-${statusBucket}`} key={order.id}>
                      <div className="profile-order-head">
                        <span>
                          <em>Order placed</em>
                          <strong>{formatOrderDate(order.dateCreated)}</strong>
                        </span>
                        <span>
                          <em>Order ID</em>
                          <strong>#{order.number}</strong>
                        </span>
                        <mark className={`is-${statusBucket}`}>{getStatusText(order)}</mark>
                      </div>
                      <div className="profile-order-basic">
                        <div>
                          <span>Payment</span>
                          <strong>{order.paymentMethod || "Razorpay"}</strong>
                        </div>
                        <div>
                          <span>Items</span>
                          <strong>{itemCount}</strong>
                        </div>
                      </div>
                      <details className="profile-order-details">
                        <summary>
                          <span>
                            <Package size={16} aria-hidden="true" />
                            Product details
                          </span>
                          <strong>{order.items.length} item{order.items.length === 1 ? "" : "s"}</strong>
                        </summary>
                        <div className="profile-order-products">
                          {order.items.map((item) => (
                            <div className="profile-order-product" key={`${order.id}-${item.id ?? item.productId ?? item.name}`}>
                              <span className="profile-order-product-media">
                                {item.image ? (
                                  <img src={item.image} alt="" loading="lazy" />
                                ) : (
                                  <Package size={24} aria-hidden="true" />
                                )}
                              </span>
                              <span className="profile-order-product-copy">
                                <strong>{item.name}</strong>
                                <em>Qty: {item.quantity}</em>
                              </span>
                              <span className="profile-order-status">
                                <i aria-hidden="true" />
                                <strong>{getStatusText(order)}</strong>
                                <em>
                                  {statusBucket === "active"
                                    ? "We will update this status as it moves."
                                    : `Placed on ${formatOrderDate(order.dateCreated)}`}
                                </em>
                              </span>
                              <span className="profile-order-product-total">{item.total}</span>
                            </div>
                          ))}
                        </div>
                      </details>
                      <div className="profile-order-actions">
                        <a href="/support#contact-form">
                          <Headphones size={16} aria-hidden="true" />
                          Need help
                        </a>
                        <a href="/all-products">
                          <RotateCcw size={16} aria-hidden="true" />
                          Buy again
                        </a>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </section>
      </main>
    </>
  );
}
