"use client";

import { ArrowLeft, Headphones, Package, RotateCcw, Search, Truck, XCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
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
  delivery?: {
    awbNumber: string;
    courierName: string;
    status: string;
    statusCode: string;
    statusLabel: string;
    location?: string;
    message?: string;
    eventTime?: string;
  };
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
type OrderFilter = "all" | OrderStatusBucket;

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

function formatShortOrderDate(value?: string) {
  if (!value) {
    return "";
  }

  return getValidDate(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short"
  });
}

function getOrderBucket(order: AccountOrder): OrderStatusBucket {
  const normalized = order.status.toLowerCase();
  const deliveryCode = order.delivery?.statusCode.toUpperCase();
  const deliveryLabel = order.delivery?.statusLabel.toLowerCase();

  if (
    ["cancelled", "refunded", "failed"].includes(normalized) ||
    deliveryCode?.startsWith("CANCEL") ||
    deliveryLabel === "cancelled" ||
    deliveryLabel === "canceled"
  ) {
    return "cancelled";
  }

  if (deliveryCode === "DL" || deliveryLabel === "delivered" || ["completed", "delivered"].includes(normalized)) {
    return "completed";
  }

  if (deliveryCode === "RT-DL" || deliveryLabel === "returned") {
    return "cancelled";
  }

  return "active";
}

function getStatusText(order: AccountOrder) {
  const bucket = getOrderBucket(order);

  if (bucket === "completed") {
    return "Delivered";
  }

  if (bucket === "cancelled") {
    if (order.delivery?.statusLabel && order.delivery.statusLabel !== "Tracking unavailable") {
      return order.delivery.statusLabel;
    }

    return order.statusLabel;
  }

  if (order.delivery?.statusLabel && order.delivery.statusLabel !== "Tracking unavailable") {
    return order.delivery.statusLabel;
  }

  return order.statusLabel || "In progress";
}

function getDeliveryDetail(order: AccountOrder) {
  if (!order.delivery) {
    return "We will update this status as it moves.";
  }

  if (order.delivery.message && order.delivery.location) {
    return `${order.delivery.message} · ${order.delivery.location}`;
  }

  return order.delivery.message || order.delivery.location || "Tracking synced from XpressBees.";
}

function getStatusHeading(order: AccountOrder) {
  const bucket = getOrderBucket(order);

  if (bucket === "completed") {
    const deliveryDate = formatShortOrderDate(order.delivery?.eventTime);
    return deliveryDate ? `Delivered on ${deliveryDate}` : "Delivered";
  }

  if (bucket === "cancelled") {
    return getStatusText(order) || "Order cancelled";
  }

  return getStatusText(order);
}

function getStatusDetail(order: AccountOrder) {
  const bucket = getOrderBucket(order);

  if (bucket === "completed") {
    return "Your item has been delivered.";
  }

  if (bucket === "cancelled") {
    return "This item will not be shipped.";
  }

  return getDeliveryDetail(order);
}

export default function AccountOrdersPage({ categories }: AccountOrdersPageProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [orders, setOrders] = useState<AccountOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState("");
  const [orderFilter, setOrderFilter] = useState<OrderFilter>("all");
  const [orderQuery, setOrderQuery] = useState("");

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

  const orderCounts = useMemo(() => {
    const counts = { all: orders.length, active: 0, completed: 0, cancelled: 0 };

    orders.forEach((order) => {
      counts[getOrderBucket(order)] += 1;
    });

    return counts;
  }, [orders]);

  const visibleOrders = useMemo(() => {
    const query = orderQuery.trim().toLowerCase();

    return orders.filter((order) => {
      if (orderFilter !== "all" && getOrderBucket(order) !== orderFilter) {
        return false;
      }

      if (!query) {
        return true;
      }

      const searchableText = [
        order.number,
        order.statusLabel,
        order.paymentMethod,
        order.delivery?.awbNumber,
        order.delivery?.courierName,
        ...order.items.map((item) => item.name)
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(query);
    });
  }, [orderFilter, orderQuery, orders]);

  const filterOptions: { value: OrderFilter; label: string }[] = [
    { value: "all", label: "All orders" },
    { value: "active", label: "In progress" },
    { value: "completed", label: "Delivered" },
    { value: "cancelled", label: "Cancelled" }
  ];

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
            <header className="orders-page-header">
              <span className="orders-page-header-icon">
                <Package size={22} aria-hidden="true" />
              </span>
              <div className="orders-page-heading">
                <p>IronRoot account</p>
                <h1 id="account-orders-title">My orders</h1>
                <span>Track deliveries, review purchases and reorder your essentials.</span>
              </div>
            </header>

            {!authReady ? (
              <div className="orders-page-loading" aria-live="polite" aria-label="Loading account">
                <span />
              </div>
            ) : !user ? (
              <div className="orders-page-state">
                <Package size={30} aria-hidden="true" />
                <h2>Sign in to view your orders</h2>
                <p>Use the email or phone number linked to your purchases.</p>
                <a href="/account">Sign in</a>
              </div>
            ) : ordersLoading ? (
              <div className="orders-page-loading" aria-live="polite">
                <span aria-label="Loading orders" />
                <p>Loading your orders...</p>
              </div>
            ) : ordersError ? (
              <div className="orders-page-state is-error" role="alert">
                <XCircle size={30} aria-hidden="true" />
                <h2>We could not load your orders</h2>
                <p>{ordersError}</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="orders-page-state">
                <Search size={34} aria-hidden="true" />
                <h2>No orders found</h2>
                <p>No previous orders were found for this account.</p>
                <a href="/all-products">Start shopping</a>
              </div>
            ) : (
              <>
                <div className="orders-page-controls">
                  <label className="orders-page-search">
                    <Search size={18} aria-hidden="true" />
                    <input
                      type="search"
                      value={orderQuery}
                      onChange={(event) => setOrderQuery(event.target.value)}
                      placeholder="Search by product or order ID"
                      aria-label="Search orders"
                    />
                  </label>
                  <div className="orders-page-filters" aria-label="Filter orders">
                    {filterOptions.map((option) => (
                      <button
                        className={orderFilter === option.value ? "is-active" : ""}
                        type="button"
                        key={option.value}
                        onClick={() => setOrderFilter(option.value)}
                        aria-pressed={orderFilter === option.value}
                      >
                        {option.label}
                        <span>{orderCounts[option.value]}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {visibleOrders.length === 0 ? (
                  <div className="orders-page-state orders-page-no-results">
                    <Search size={30} aria-hidden="true" />
                    <h2>No matching orders</h2>
                    <p>Try another order ID, product name or status filter.</p>
                    <button
                      type="button"
                      onClick={() => {
                        setOrderFilter("all");
                        setOrderQuery("");
                      }}
                    >
                      Clear filters
                    </button>
                  </div>
                ) : (
                  <div className="orders-page-results">
                    {visibleOrders.map((order) => {
                      const statusBucket = getOrderBucket(order);
                      const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);

                      return (
                        <article className={`orders-list-card is-${statusBucket}`} key={order.id}>
                          <div className="orders-list-items">
                            {order.items.map((item) => (
                              <div
                                className="orders-list-row"
                                key={`${order.id}-${item.id ?? item.productId ?? item.name}`}
                              >
                                <span className="orders-list-media">
                                  {item.image ? (
                                    <img src={item.image} alt="" loading="lazy" />
                                  ) : (
                                    <Package size={28} aria-hidden="true" />
                                  )}
                                </span>

                                <span className="orders-list-product">
                                  <strong>{item.name}</strong>
                                  <em>Quantity: {item.quantity}</em>
                                </span>

                                <strong className="orders-list-price">{item.total}</strong>

                                <span className="orders-list-delivery">
                                  <strong>
                                    <i aria-hidden="true" />
                                    {getStatusHeading(order)}
                                  </strong>
                                  <em>{getStatusDetail(order)}</em>
                                  <a href="/all-products">
                                    <RotateCcw size={15} aria-hidden="true" />
                                    Buy this product again
                                  </a>
                                </span>
                              </div>
                            ))}
                          </div>

                          <footer className="orders-list-footer">
                            <span>
                              Order <strong>#{order.number}</strong>
                            </span>
                            <span>Placed {formatOrderDate(order.dateCreated)}</span>
                            <span>{itemCount} item{itemCount === 1 ? "" : "s"}</span>
                            <span>Total <strong>{order.total}</strong></span>
                            <span>{order.paymentMethod || "Online payment"}</span>
                            {order.delivery?.awbNumber ? (
                              <span>
                                <Truck size={14} aria-hidden="true" />
                                {order.delivery.courierName || "Courier"}: {order.delivery.awbNumber}
                              </span>
                            ) : null}
                            <a href="/support#contact-form">
                              <Headphones size={15} aria-hidden="true" />
                              Need help?
                            </a>
                          </footer>
                        </article>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </section>
        </section>
      </main>
    </>
  );
}
