"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

export type CartProduct = {
  id?: number | string;
  name: string;
  price: string;
  image: string;
  tag?: string;
  href?: string;
};

export type CartItem = CartProduct & {
  key: string;
  quantity: number;
};

type CartContextValue = {
  items: CartItem[];
  isOpen: boolean;
  isHydrated: boolean;
  itemCount: number;
  subtotal: number;
  addItem: (product: CartProduct, quantity?: number) => void;
  updateQuantity: (key: string, quantity: number) => void;
  removeItem: (key: string) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const cartStorageKey = "ironroot-cart-items";

type RefreshCartResponse = {
  items?: CartItem[];
};

function cartKey(product: CartProduct) {
  return String(product.id ?? product.href ?? product.name);
}

function readPrice(value: string) {
  const parsed = Number(value.replace(/[^0-9.]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeStoredItems(value: unknown): CartItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item): CartItem | null => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const candidate = item as Partial<CartItem>;

      if (
        typeof candidate.key !== "string" ||
        typeof candidate.name !== "string" ||
        typeof candidate.price !== "string" ||
        typeof candidate.image !== "string"
      ) {
        return null;
      }

      return {
        id: candidate.id,
        key: candidate.key,
        name: candidate.name,
        price: candidate.price,
        image: candidate.image,
        tag: typeof candidate.tag === "string" ? candidate.tag : undefined,
        href: typeof candidate.href === "string" ? candidate.href : undefined,
        quantity:
          typeof candidate.quantity === "number" && Number.isFinite(candidate.quantity)
            ? Math.max(1, Math.floor(candidate.quantity))
            : 1
      };
    })
    .filter((item): item is CartItem => Boolean(item));
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const refreshedStoredCart = useRef(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(cartStorageKey);

      if (stored) {
        setItems(normalizeStoredItems(JSON.parse(stored)));
      }
    } catch {
      window.localStorage.removeItem(cartStorageKey);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    if (items.length === 0) {
      window.localStorage.removeItem(cartStorageKey);
      return;
    }

    window.localStorage.setItem(cartStorageKey, JSON.stringify(items));
  }, [isHydrated, items]);

  useEffect(() => {
    if (!isHydrated || refreshedStoredCart.current || items.length === 0) {
      return;
    }

    refreshedStoredCart.current = true;

    fetch("/api/cart/refresh", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ items })
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((data: RefreshCartResponse | null) => {
        if (!data?.items || data.items.length === 0) {
          return;
        }

        setItems(normalizeStoredItems(data.items));
      })
      .catch(() => {
        // Keep the existing cart if the latest price refresh fails.
      });
  }, [isHydrated, items]);

  const addItem = (product: CartProduct, quantity = 1) => {
    const key = cartKey(product);

    setItems((current) => {
      const existing = current.find((item) => item.key === key);

      if (existing) {
        return current.map((item) =>
          item.key === key ? { ...product, key, quantity: item.quantity + quantity } : item
        );
      }

      return [...current, { ...product, key, quantity }];
    });
    setIsOpen(true);
  };

  const updateQuantity = (key: string, quantity: number) => {
    setItems((current) =>
      current
        .map((item) => (item.key === key ? { ...item, quantity: Math.max(0, quantity) } : item))
        .filter((item) => item.quantity > 0)
    );
  };

  const removeItem = (key: string) => {
    setItems((current) => current.filter((item) => item.key !== key));
  };

  const clearCart = () => {
    setItems([]);
  };

  const value = useMemo<CartContextValue>(() => {
    const itemCount = items.reduce((total, item) => total + item.quantity, 0);
    const subtotal = items.reduce((total, item) => total + readPrice(item.price) * item.quantity, 0);

    return {
      items,
      isOpen,
      isHydrated,
      itemCount,
      subtotal,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
      openCart: () => setIsOpen(true),
      closeCart: () => setIsOpen(false)
    };
  }, [items, isOpen, isHydrated]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }

  return context;
}
