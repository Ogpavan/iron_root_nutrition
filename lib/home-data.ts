export const asset = (name: string) => `/assets/bolero/${name}`;
export const heroImage = `${asset("hero-bolero.webp")}?v=20260610-131033`;

export type HomeProduct = {
  id?: number | string;
  sku?: string;
  barcode?: string;
  slug?: string;
  name: string;
  tag: string;
  price: string;
  image: string;
  hoverImage?: string;
  galleryImages?: string[];
  categoryNames?: string[];
  categorySlugs?: string[];
  descriptionHtml?: string;
  description?: string;
  shortDescription?: string;
  stockStatus?: string;
  tone: string;
  href?: string;
};

type NavItem = {
  label: string;
  href: string;
  accessKey?: string;
  image?: string;
  imageAlt?: string;
  dropdown?: boolean;
  featured?: boolean;
  mobileOnlyPage?: boolean;
  menuKey?: "categories" | "concerns";
};

export const navItems: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "All Products", href: "/all-products" },
  {
    label: "Shop by Category",
    href: "/shop-by-category",
    dropdown: true,
    mobileOnlyPage: true,
    menuKey: "categories"
  },
  {
    label: "Shop by Concern",
    href: "/shop-by-concern",
    dropdown: true,
    mobileOnlyPage: true,
    menuKey: "concerns"
  },
  { label: "Authenticity", href: "/authenticity" }
];

export type ConcernItem = {
  title: string;
  href: string;
  image: string;
};

export const concernItems: ConcernItem[] = [
  {
    title: "Build Lean Muscle",
    href: "/all-products?concern=build-lean-muscle",
    image: "https://admin.ironrootnutrition.com/wp-content/uploads/2026/06/ChatGPT-Image-Jun-16-2026-03_07_26-PM.png"
  },
  {
    title: "Strength & Performance",
    href: "/all-products?concern=strength-performance",
    image: "https://admin.ironrootnutrition.com/wp-content/uploads/2026/06/ChatGPT-Image-Jun-16-2026-03_36_41-PM.png"
  },
  {
    title: "Mass & Weight Gain",
    href: "/all-products?concern=mass-weight-gain",
    image: "https://admin.ironrootnutrition.com/wp-content/uploads/2026/06/ChatGPT-Image-Jun-16-2026-03_22_10-PM.png"
  },
  {
    title: "Recovery & Repair",
    href: "/all-products?concern=recovery-repair",
    image: "https://admin.ironrootnutrition.com/wp-content/uploads/2026/06/ChatGPT-Image-Jun-16-2026-03_24_37-PM.png"
  },
  {
    title: "Overall Health & Wellness",
    href: "/all-products?concern=overall-health-wellness",
    image: "https://admin.ironrootnutrition.com/wp-content/uploads/2026/06/ChatGPT-Image-Jun-16-2026-03_28_35-PM.png"
  }
];

export const products: HomeProduct[] = [
  {
    name: "Bolero Aardbei 9g",
    tag: "Bolero",
    price: "EUR 12.95",
    image: asset("product-strawberry.png"),
    tone: "#f34a45"
  },
  {
    name: "Bolero Ananas 9g",
    tag: "Bolero",
    price: "EUR 12.95",
    image: asset("product-pineapple.png"),
    tone: "#f6b63b"
  },
  {
    name: "Bolero Acai Bes 9g",
    tag: "Bolero",
    price: "EUR 12.95",
    image: asset("product-acai.png"),
    tone: "#6d3aa2"
  },
  {
    name: "Bolero Appel 9g",
    tag: "Bolero",
    price: "EUR 12.95",
    image: asset("product-apple.png"),
    tone: "#31a164"
  },
  {
    name: "Bolero Banaan Aardbei 9g",
    tag: "Bolero",
    price: "EUR 12.95",
    image: asset("product-banana-strawberry.png"),
    tone: "#e84d92"
  }
];

export const flavourTiles = [
  {
    title: "Tital Meal Mass Gainer",
    image:
      "https://admin.ironrootnutrition.com/wp-content/uploads/2026/06/ChatGPT-Image-Jun-10-2026-05_46_39-PM.png",
    href: "#products"
  },
  {
    title: "Pro Fusion",
    image:
      "https://admin.ironrootnutrition.com/wp-content/uploads/2026/06/ChatGPT-Image-Jun-10-2026-05_49_04-PM.png",
    href: "#products"
  },
  {
    title: "Pre Shock",
    image:
      "https://admin.ironrootnutrition.com/wp-content/uploads/2026/06/ChatGPT-Image-Jun-10-2026-05_48_39-PM.png",
    href: "#products"
  }
];

export const stats = [
  { value: "600+", label: "Happy\ncustomers" },
  { value: "6", label: "Training\ncategories" },
  { value: "100%", label: "Authenticity\ncheck" },
  { value: "24/7", label: "Customer\nsupport" }
];

export const news = [
  {
    title: "Protein timing for better recovery",
    image:
      "https://admin.ironrootnutrition.com/wp-content/uploads/2026/06/ChatGPT-Image-Jun-11-2026-03_23_39-PM-1.png",
    date: "11 Jun 2026",
    author: "IronRoot Team",
    badge: "Recovery"
  },
  {
    title: "Creatine monohydrate for daily strength",
    image:
      "https://admin.ironrootnutrition.com/wp-content/uploads/2026/06/ChatGPT-Image-Jun-11-2026-03_29_27-PM.png",
    date: "11 Jun 2026",
    author: "IronRoot Team",
    badge: "Creatine"
  },
  {
    title: "Pre-workout focus without overcomplication",
    image:
      "https://admin.ironrootnutrition.com/wp-content/uploads/2026/06/ChatGPT-Image-Jun-11-2026-03_23_40-PM-3.png",
    date: "11 Jun 2026",
    author: "IronRoot Team",
    badge: "Training"
  }
];

export const services = [
  {
    title: "Email us",
    text: "Monday - Friday, within 24 hours",
    icon: asset("service-email.svg")
  },
  {
    title: "Call us",
    text: "24/7 available for assistance",
    icon: asset("service-call.svg")
  },
  {
    title: "Livechat",
    text: "Talk directly with our support team",
    icon: asset("service-livechat.svg")
  },
  {
    title: "Reviews",
    text: "More than 24.000 satisfied customers",
    icon: asset("service-reviews.svg")
  }
];
