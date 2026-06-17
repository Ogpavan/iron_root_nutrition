"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import AccountOtpModal from "@/components/AccountOtpModal";
import { useCart } from "@/components/cart/CartProvider";
import { accountStorageKey, normalizeStoredUser, type AuthUser } from "@/lib/account-auth";

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0
});

export default function MiniCart() {
  const { closeCart, isOpen, itemCount, items, removeItem, subtotal, updateQuantity } = useCart();
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [authOpen, setAuthOpen] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(accountStorageKey);

    if (stored) {
      try {
        setAuthUser(normalizeStoredUser(JSON.parse(stored)));
      } catch {
        window.localStorage.removeItem(accountStorageKey);
      }
    }

    const handleStorage = () => {
      const nextStored = window.localStorage.getItem(accountStorageKey);

      if (!nextStored) {
        setAuthUser(null);
        return;
      }

      try {
        setAuthUser(normalizeStoredUser(JSON.parse(nextStored)));
      } catch {
        setAuthUser(null);
      }
    };

    window.addEventListener("storage", handleStorage);

    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  return (
    <AnimatePresence>
      {isOpen ? (
        <div className="mini-cart-shell" role="presentation">
          <motion.button
            type="button"
            className="mini-cart-backdrop"
            aria-label="Close cart"
            onClick={closeCart}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
          <motion.aside
            className="mini-cart-panel"
            role="dialog"
            aria-modal="true"
            aria-label="Mini cart"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.32, ease: [0.2, 0.72, 0.2, 1] }}
          >
            <div className="mini-cart-header">
              <div>
                <span>Cart</span>
                <strong>{itemCount} items</strong>
              </div>
              <button type="button" aria-label="Close cart" onClick={closeCart}>
                <X size={19} aria-hidden="true" />
              </button>
            </div>

            {items.length > 0 ? (
              <>
                <div className="mini-cart-items">
                  {items.map((item) => (
                    <article className="mini-cart-item" key={item.key}>
                      <a className="mini-cart-image" href={item.href ?? "#"} onClick={closeCart}>
                        <Image src={item.image} alt={item.name} fill sizes="92px" />
                      </a>
                      <div className="mini-cart-info">
                        <small>{item.tag ?? "IronRoot"}</small>
                        <a href={item.href ?? "#"} onClick={closeCart}>
                          {item.name}
                        </a>
                        <strong>{item.price}</strong>
                        <div className="mini-cart-item-actions">
                          <div className="mini-cart-qty" aria-label={`Quantity for ${item.name}`}>
                            <button
                              type="button"
                              aria-label="Decrease quantity"
                              onClick={() => updateQuantity(item.key, item.quantity - 1)}
                            >
                              <Minus size={13} aria-hidden="true" />
                            </button>
                            <span>{item.quantity}</span>
                            <button
                              type="button"
                              aria-label="Increase quantity"
                              onClick={() => updateQuantity(item.key, item.quantity + 1)}
                            >
                              <Plus size={13} aria-hidden="true" />
                            </button>
                          </div>
                          <button
                            type="button"
                            className="mini-cart-remove"
                            aria-label={`Remove ${item.name}`}
                            onClick={() => removeItem(item.key)}
                          >
                            <Trash2 size={15} aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>

                <div className="mini-cart-footer">
                  <div className="mini-cart-subtotal">
                    <span>Subtotal</span>
                    <strong>{currencyFormatter.format(subtotal)}</strong>
                  </div>
                  {authUser ? (
                    <Link className="mini-cart-checkout" href="/checkout" onClick={closeCart}>
                      Checkout
                    </Link>
                  ) : (
                    <button
                      type="button"
                      className="mini-cart-checkout"
                      onClick={() => setAuthOpen(true)}
                    >
                      Login
                    </button>
                  )}
                  <button type="button" className="mini-cart-continue" onClick={closeCart}>
                    Continue shopping
                  </button>
                </div>
              </>
            ) : (
              <div className="mini-cart-empty">
                <ShoppingBag size={34} aria-hidden="true" />
                <strong>Your cart is empty</strong>
                <p>Add products to see them here.</p>
                <button type="button" onClick={closeCart}>
                  Continue shopping
                </button>
              </div>
            )}
          </motion.aside>
          <AccountOtpModal
            open={authOpen && !authUser}
            onClose={() => setAuthOpen(false)}
            onUserChange={setAuthUser}
            redirectTo={null}
          />
        </div>
      ) : null}
    </AnimatePresence>
  );
}
