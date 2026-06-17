"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ChevronDown, ChevronRight, Menu, Search, ShoppingBag, User, X } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  type FormEvent
} from "react";
import AccountOtpModal from "@/components/AccountOtpModal";
import { useCart } from "@/components/cart/CartProvider";
import ConcernMegaMenu from "@/components/shared/ConcernMegaMenu";
import CategoryMegaMenu from "@/components/shared/CategoryMegaMenu";
import TopHeaderStrip from "@/components/shared/TopHeaderStrip";
import {
  accountStorageKey,
  getAccountInitials,
  normalizeStoredUser,
  type AuthUser
} from "@/lib/account-auth";
import { navItems, products as fallbackSearchProducts, type HomeProduct } from "@/lib/home-data";
import type { WooCatalogCategory } from "@/lib/woocommerce";

const menuLogoImage =
  "https://admin.ironrootnutrition.com/wp-content/uploads/2026/06/ironroot.png";
const menuLogoDarkImage =
  "https://admin.ironrootnutrition.com/wp-content/uploads/2026/06/black-img.png";

type SiteHeaderProps = {
  variant?: "overlay" | "solid";
  categories: WooCatalogCategory[];
  searchProducts?: HomeProduct[];
};

type SearchResponse = {
  products?: HomeProduct[];
};

function normalizeSearch(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function getSearchHref(product: HomeProduct) {
  if (product.href) {
    return product.href;
  }

  if (product.slug) {
    return `/products/${product.slug}`;
  }

  return "/all-products";
}

function withSearchHref(product: HomeProduct): HomeProduct {
  return {
    ...product,
    href: getSearchHref(product)
  };
}

function dedupeSearchProducts(products: HomeProduct[]) {
  const unique = new Map<string, HomeProduct>();

  products.forEach((product) => {
    const key = String(product.id ?? product.slug ?? product.name);

    if (!unique.has(key)) {
      unique.set(key, withSearchHref(product));
    }
  });

  return Array.from(unique.values());
}

function matchesSearch(product: HomeProduct, query: string) {
  const terms = normalizeSearch(query).split(" ").filter(Boolean);

  if (terms.length === 0) {
    return true;
  }

  const haystack = normalizeSearch(
    [
      product.name,
      product.tag,
      product.price,
      product.sku,
      product.slug,
      product.shortDescription,
      product.description
    ]
      .filter(Boolean)
      .join(" ")
  );

  return terms.every((term) => haystack.includes(term));
}

export default function SiteHeader({
  variant = "overlay",
  categories,
  searchProducts
}: SiteHeaderProps) {
  const router = useRouter();
  const { itemCount, openCart } = useCart();
  const initialSearchCatalog = useMemo(
    () => dedupeSearchProducts(searchProducts?.length ? searchProducts : fallbackSearchProducts),
    [searchProducts]
  );
  const [open, setOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [activeMenu, setActiveMenu] = useState<"categories" | "concerns" | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [searchCatalog, setSearchCatalog] = useState<HomeProduct[]>(initialSearchCatalog);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchCatalogLoaded, setSearchCatalogLoaded] = useState(
    () => (searchProducts?.length ?? 0) >= 12
  );
  const [searchPending, startSearchTransition] = useTransition();
  const closeTimer = useRef<number | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const isSolid = variant === "solid";
  const navigationKey = navItems.map((item) => item.label).join("|");
  const logoSrc = isSolid || scrolled ? menuLogoDarkImage : menuLogoImage;
  const accountInitials = getAccountInitials(authUser);
  const activeSearchQuery = debouncedSearchQuery.trim();
  const matchedSearchProducts = useMemo(() => {
    const source = activeSearchQuery
      ? searchCatalog.filter((product) => matchesSearch(product, activeSearchQuery))
      : searchCatalog;

    return source;
  }, [activeSearchQuery, searchCatalog]);
  const visibleSearchProducts = matchedSearchProducts.slice(0, 6);
  const showSearchPanel = searchOpen && activeSearchQuery.length > 0;

  const openMenu = (menu: "categories" | "concerns") => {
    if (closeTimer.current !== null) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }

    setActiveMenu(menu);
  };

  const scheduleCloseMenu = () => {
    if (closeTimer.current !== null) {
      window.clearTimeout(closeTimer.current);
    }

    closeTimer.current = window.setTimeout(() => {
      setActiveMenu(null);
      closeTimer.current = null;
    }, 160);
  };

  const openSearch = () => {
    if (closeTimer.current !== null) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }

    setActiveMenu(null);
    setOpen(false);
    setSearchOpen(true);
  };

  const closeSearch = () => {
    setSearchOpen(false);
    setSearchQuery("");
    setDebouncedSearchQuery("");
  };

  const runSearch = (value: string) => {
    const query = value.trim();
    const href = query ? `/all-products?q=${encodeURIComponent(query)}` : "/all-products";

    setSearchOpen(false);
    setSearchQuery("");
    startSearchTransition(() => {
      router.push(href);
    });
  };

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    runSearch(searchQuery);
  };

  const handleAccountClick = () => {
    if (authUser) {
      router.push("/account");
      return;
    }

    setAccountOpen(true);
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 72);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setSearchCatalog(initialSearchCatalog);
    setSearchCatalogLoaded((searchProducts?.length ?? 0) >= 12);
  }, [initialSearchCatalog, searchProducts]);

  useEffect(() => {
    if (!searchOpen) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      searchInputRef.current?.focus();
    });

    return () => window.cancelAnimationFrame(frame);
  }, [searchOpen]);

  useEffect(() => {
    if (!searchOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeSearch();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [searchOpen]);

  useEffect(() => {
    if (!searchOpen) {
      setDebouncedSearchQuery("");
      return;
    }

    const timer = window.setTimeout(() => {
      setDebouncedSearchQuery(searchQuery.trim());
    }, 260);

    return () => window.clearTimeout(timer);
  }, [searchOpen, searchQuery]);

  useEffect(() => {
    if (!searchOpen || searchCatalogLoaded || activeSearchQuery.length === 0) {
      return;
    }

    const controller = new AbortController();

    setSearchLoading(true);

    async function loadSearchCatalog() {
      try {
        const response = await fetch("/api/search?limit=48", {
          cache: "no-store",
          signal: controller.signal
        });

        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as SearchResponse;

        if (Array.isArray(data.products) && data.products.length > 0) {
          setSearchCatalog((current) => dedupeSearchProducts([...data.products!, ...current]));
        }

        setSearchCatalogLoaded(true);
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          setSearchCatalogLoaded(false);
        }
      } finally {
        if (!controller.signal.aborted) {
          setSearchLoading(false);
        }
      }
    }

    void loadSearchCatalog();

    return () => controller.abort();
  }, [activeSearchQuery, searchCatalogLoaded, searchOpen]);

  useEffect(() => {
    return () => {
      if (closeTimer.current !== null) {
        window.clearTimeout(closeTimer.current);
      }
    };
  }, []);

  useEffect(() => {
    const stored = window.localStorage.getItem(accountStorageKey);

    if (!stored) {
      return;
    }

    try {
      setAuthUser(normalizeStoredUser(JSON.parse(stored)));
    } catch {
      window.localStorage.removeItem(accountStorageKey);
    }
  }, []);

  return (
    <>
      <header className={`site-header${scrolled ? " is-scrolled" : ""}${isSolid ? " is-solid" : ""}`}>
        <AnimatePresence initial={false} mode="wait">
          {searchOpen ? (
            <motion.form
              key="search-strip"
              className="header-search-bar"
              role="search"
              aria-busy={searchPending || searchLoading}
              initial={{ clipPath: "inset(0 100% 0 0)", opacity: 1 }}
              animate={{ clipPath: "inset(0 0% 0 0)", opacity: 1 }}
              exit={{ clipPath: "inset(0 100% 0 0)", opacity: 1 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              onSubmit={handleSearchSubmit}
            >
              <button
                className="header-search-back"
                type="button"
                aria-label="Close search"
                onClick={closeSearch}
              >
                <ArrowLeft size={21} strokeWidth={2.1} />
              </button>
              <input
                ref={searchInputRef}
                className="header-search-field"
                type="search"
                value={searchQuery}
                placeholder="What are you looking for?"
                autoComplete="off"
                spellCheck={false}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
              {searchQuery ? (
                <button
                  className="header-search-clear"
                  type="button"
                  aria-label="Clear search"
                  onClick={() => {
                    setSearchQuery("");
                    searchInputRef.current?.focus();
                  }}
                >
                  <X size={14} strokeWidth={2.4} />
                </button>
              ) : null}
              <button className="header-search-submit" type="submit" aria-label="Search">
                <Search size={21} strokeWidth={2.1} />
              </button>
            </motion.form>
          ) : (
            <motion.div
              key="utility-strip"
              className="header-strip-motion"
              initial={{ clipPath: "inset(0 100% 0 0)", opacity: 1 }}
              animate={{ clipPath: "inset(0 0% 0 0)", opacity: 1 }}
              exit={{ clipPath: "inset(0 100% 0 0)", opacity: 1 }}
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            >
              <TopHeaderStrip />
            </motion.div>
          )}
        </AnimatePresence>
        <div
          className="site-header-shell"
          onMouseEnter={() => {
            if (activeMenu) {
              openMenu(activeMenu);
            }
          }}
          onMouseLeave={scheduleCloseMenu}
        >
        <div className="header-main">
          <a className="mobile-header-logo" href="/" aria-label="IronRoot homepage">
            <Image src={logoSrc} width={156} height={28} alt="IronRoot" priority />
          </a>
          <nav
            key={`desktop-${navigationKey}`}
            className="desktop-nav"
            aria-label="Primary navigation"
          >
            <a className="menu-logo" href="/" aria-label="IronRoot homepage">
              <Image src={logoSrc} width={210} height={38} alt="IronRoot" priority />
            </a>
            {navItems.map((item, index) => (
              <div
                key={`${item.label}-${index}`}
                className={`nav-item-wrap${item.menuKey ? " has-menu" : ""}`}
                onMouseEnter={() => {
                  if (item.menuKey) {
                    openMenu(item.menuKey);
                  }
                }}
                onFocusCapture={() => {
                  if (item.menuKey) {
                    openMenu(item.menuKey);
                  }
                }}
              >
                <a
                  accessKey={item.accessKey}
                  className={item.featured ? "nav-featured" : undefined}
                  href={item.mobileOnlyPage && item.menuKey ? "#" : item.href}
                  aria-haspopup={item.menuKey ? "true" : undefined}
                  aria-expanded={item.menuKey ? activeMenu === item.menuKey : undefined}
                  onClick={(event) => {
                    if (item.mobileOnlyPage && item.menuKey) {
                      event.preventDefault();
                      openMenu(item.menuKey);
                    }
                  }}
                >
                  <span className="nav-label">{item.label}</span>
                  {item.dropdown ? (
                    <ChevronDown
                      aria-hidden="true"
                      className="nav-chevron"
                      size={12}
                      strokeWidth={2.1}
                    />
                  ) : null}
                </a>
              </div>
            ))}
          </nav>

          <div className="header-actions">
            <button
              className="icon-button"
              type="button"
              aria-label="Search"
              aria-expanded={searchOpen}
              onClick={openSearch}
            >
              <Search size={20} />
            </button>
            <button
              className="icon-button desktop-only"
              type="button"
              aria-label={authUser ? "Open profile" : "Login or sign up"}
              onClick={handleAccountClick}
            >
              {accountInitials ? (
                <span className="account-initials" aria-hidden="true">
                  {accountInitials}
                </span>
              ) : (
                <User size={20} />
              )}
            </button>
            <button className="icon-button cart-icon-button" aria-label="Open cart" onClick={openCart}>
              <ShoppingBag size={20} />
              {itemCount > 0 ? <span>{itemCount}</span> : null}
            </button>
            <button
              className="icon-button mobile-menu-button"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              onClick={() => setOpen((value) => !value)}
            >
              {open ? <X size={19} /> : <Menu size={19} />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {searchOpen ? (
            <motion.button
              key="header-search-backdrop"
              type="button"
              className="header-search-backdrop"
              aria-label="Close search"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              onClick={closeSearch}
            />
          ) : null}
        </AnimatePresence>

        <AnimatePresence>
          {showSearchPanel ? (
            <motion.div
              key="header-search-panel"
              className="header-search-panel"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
            >
              <div className="header-search-panel-inner">
                <div className="header-search-summary">
                  <p>
                    {activeSearchQuery
                      ? `${matchedSearchProducts.length} results for "${activeSearchQuery}"`
                      : "Popular search results"}
                  </p>
                  <button type="button" onClick={() => runSearch(searchQuery)}>
                    View all results <ChevronRight aria-hidden="true" size={15} />
                  </button>
                </div>

                {visibleSearchProducts.length > 0 ? (
                  <div className="header-search-results">
                    {visibleSearchProducts.map((product) => (
                      <a
                        className="header-search-result"
                        href={product.href ?? "/all-products"}
                        key={product.id ?? product.slug ?? product.name}
                        onClick={closeSearch}
                      >
                        <span className="header-search-result-thumb">
                          <Image
                            src={product.image}
                            alt=""
                            fill
                            sizes="80px"
                            aria-hidden="true"
                          />
                        </span>
                        <span className="header-search-result-title">{product.name}</span>
                        <span className="header-search-result-price">{product.price}</span>
                      </a>
                    ))}
                  </div>
                ) : null}

                {!searchLoading && visibleSearchProducts.length === 0 ? (
                  <p className="header-search-empty">No quick results found.</p>
                ) : null}
                {searchLoading ? <p className="header-search-loading">Loading products</p> : null}
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <AnimatePresence>
          {activeMenu ? (
            <motion.div
              className="category-backdrop"
              aria-hidden="true"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
            />
          ) : null}
        </AnimatePresence>

        <AnimatePresence>
          {activeMenu === "categories" ? (
            <CategoryMegaMenu
              key="categories-menu"
              categories={categories}
              open={activeMenu === "categories"}
              onMouseEnter={() => openMenu("categories")}
              onMouseLeave={scheduleCloseMenu}
            />
          ) : null}
        </AnimatePresence>

        <AnimatePresence>
          {activeMenu === "concerns" ? (
            <ConcernMegaMenu
              key="concerns-menu"
              open={activeMenu === "concerns"}
              onMouseEnter={() => openMenu("concerns")}
              onMouseLeave={scheduleCloseMenu}
            />
          ) : null}
        </AnimatePresence>

        <AnimatePresence>
          {open ? (
            <motion.nav
              className="mobile-nav"
              key={`mobile-${navigationKey}`}
              aria-label="Mobile navigation"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22 }}
            >
              {navItems.map((item, index) => (
                <a
                  key={`${item.label}-${index}`}
                  className={item.featured ? "nav-featured" : undefined}
                  href={item.href}
                  onMouseEnter={() => {
                    if (item.menuKey) {
                      openMenu(item.menuKey);
                    }
                  }}
                >
                  <span className="nav-label">{item.label}</span>
                  {item.dropdown ? (
                    <ChevronDown
                      aria-hidden="true"
                      className="nav-chevron"
                      size={12}
                      strokeWidth={2.1}
                    />
                  ) : null}
                </a>
              ))}
              <button
                className="mobile-nav-auth"
                type="button"
                onClick={() => {
                  setOpen(false);
                  handleAccountClick();
                }}
              >
                <span className="nav-label">
                  {authUser ? `Account: ${getAccountInitials(authUser)}` : "Login / Sign up"}
                </span>
              </button>
            </motion.nav>
          ) : null}
        </AnimatePresence>
      </div>
    </header>
    <AccountOtpModal
      open={accountOpen}
      onClose={() => setAccountOpen(false)}
      onUserChange={setAuthUser}
    />
    </>
  );
}
