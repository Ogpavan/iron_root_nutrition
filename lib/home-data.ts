export const asset = (name: string) => `/assets/bolero/${name}`;
export const heroImage =
  "https://admin.ironrootnutrition.com/wp-content/uploads/2026/07/ChatGPT-Image-Jul-1-2026-05_01_36-PM.png";

export type ProductAttribute = {
  id?: number;
  name: string;
  slug?: string;
  options: string[];
  visible?: boolean;
  variation?: boolean;
};

export type ProductVariationAttribute = {
  id?: number;
  name: string;
  slug?: string;
  option: string;
};

export type ProductDimensions = {
  length: number;
  width: number;
  height: number;
  unit: "cm";
};

export type ProductPackage = {
  weight: number;
  weightUnit: "kg";
  dimensions: ProductDimensions;
};

export type ProductVariation = {
  id: number;
  sku?: string;
  price: string;
  mrp?: string;
  image?: string;
  stockStatus?: string;
  package?: ProductPackage;
  attributes: ProductVariationAttribute[];
};

export type HomeProduct = {
  id?: number | string;
  sku?: string;
  barcode?: string;
  slug?: string;
  name: string;
  tag: string;
  price: string;
  mrp?: string;
  image: string;
  hoverImage?: string;
  galleryImages?: string[];
  categoryNames?: string[];
  categorySlugs?: string[];
  descriptionHtml?: string;
  description?: string;
  shortDescription?: string;
  stockStatus?: string;
  package?: ProductPackage;
  attributes?: ProductAttribute[];
  defaultAttributes?: ProductVariationAttribute[];
  variations?: ProductVariation[];
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
    id: 110,
    sku: "IR-TITAN-MEAL-MASS-GAINER",
    slug: "titan-meal-mass-gainer",
    name: "Titan Meal Mass Gainer",
    tag: "Mass Gainer",
    price: "₹3,749",
    mrp: "₹4,999",
    image: "https://admin.ironrootnutrition.com/wp-content/uploads/2026/06/Titan_Meal_Mass_Gainer-Choco_Charge-1Kg-Front.jpg",
    categoryNames: ["Mass Gainer"],
    categorySlugs: ["mass-gainer"],
    shortDescription: "Balanced nutrition for steady gains.",
    tone: "#d86128"
  },
  {
    id: 82,
    sku: "IR-PRO-FUSION-WHEY-PROTEIN",
    slug: "profusion-whey-protein",
    name: "ProFusion Whey Protein",
    tag: "Whey Protein",
    price: "₹5,249",
    mrp: "₹6,999",
    image: "https://admin.ironrootnutrition.com/wp-content/uploads/2026/06/Pro_Fusion_Whey_Protein_Choco_Charge_2Kg_Front.jpg",
    categoryNames: ["Whey Protein"],
    categorySlugs: ["whey-protein"],
    shortDescription: "Premium whey protein designed to support muscle growth and recovery.",
    tone: "#8a5a3c"
  },
  {
    id: 81,
    sku: "IR-PRE-SHOCK-PRE-WORKOUT",
    slug: "pre-shock-pre-workout",
    name: "Pre-Shock Pre-Workout",
    tag: "Pre Workout",
    price: "₹1,724",
    mrp: "₹2,299",
    image: "https://admin.ironrootnutrition.com/wp-content/uploads/2026/06/Preshock_Pre_workout_Artic_Blue_Rush_Front.jpg",
    categoryNames: ["Pre Workout"],
    categorySlugs: ["pre-workout"],
    shortDescription: "Ignite your energy and focus before every workout.",
    tone: "#228fcf"
  },
  {
    id: 24,
    sku: "IR-MYOFUEL-WHEY-PROTEIN",
    slug: "myofuel-whey-protein",
    name: "Myofuel Whey Protein",
    tag: "Whey Protein",
    price: "₹6,374",
    mrp: "₹8,499",
    image: "https://admin.ironrootnutrition.com/wp-content/uploads/2026/06/Myofuel_Whey_Protein_Choco_Charge_1kg_Front.jpg",
    categoryNames: ["Whey Protein"],
    categorySlugs: ["whey-protein"],
    shortDescription: "Premium whey protein designed to support muscle growth and recovery.",
    tone: "#b76a30"
  },
  {
    id: 21,
    sku: "IR-INTRACHARGE-BCAA",
    slug: "intracharge-bcaa",
    name: "Intracharge BCAA",
    tag: "BCAA",
    price: "₹1,499",
    mrp: "₹1,999",
    image: "https://admin.ironrootnutrition.com/wp-content/uploads/2026/06/Intracharge_BCAA_Artic_Blue_Rush-Front.jpg",
    categoryNames: ["BCAA"],
    categorySlugs: ["bcaa"],
    shortDescription: "Endurance and recovery in every sip.",
    tone: "#2c7fbb"
  },
  {
    id: 20,
    sku: "IR-GLUTA-BUILD-GLUTAMINE",
    slug: "glutabuild-l-glutamine",
    name: "GlutaBuild - L-Glutamine",
    tag: "Post Workout",
    price: "₹1,200",
    mrp: "₹1,600",
    image: "https://admin.ironrootnutrition.com/wp-content/uploads/2026/06/Gluta_Build_Glutamine_Unflavoured_Front.jpg",
    categoryNames: ["Post Workout", "Glutamine"],
    categorySlugs: ["post-workout", "glutamine"],
    shortDescription: "Daily nutritional support for a stronger, healthier you.",
    tone: "#5c8f3d"
  },
  {
    id: 19,
    sku: "IR-CREALIFT-CREATINE",
    slug: "crealift-creatine",
    name: "Crealift Creatine",
    tag: "Pre Workout",
    price: "₹561",
    mrp: "₹749",
    image: "https://admin.ironrootnutrition.com/wp-content/uploads/2026/06/Crealift_Creatine_Unflavoured_Front.jpg",
    categoryNames: ["Pre Workout", "Creatine"],
    categorySlugs: ["pre-workout", "creatine"],
    shortDescription: "Support strength, endurance, and performance.",
    tone: "#95a9b6"
  },
  {
    id: 17,
    sku: "IR-BIG-BUILD-WEIGHT-GAINER",
    slug: "big-build-weight-gainer",
    name: "Big Build Weight Gainer",
    tag: "Mass Gainer",
    price: "₹2,999",
    mrp: "₹3,999",
    image: "https://admin.ironrootnutrition.com/wp-content/uploads/2026/06/Big_Build_Weight_Gainer_Chocolate_1kg_Front.jpg",
    categoryNames: ["Mass Gainer"],
    categorySlugs: ["mass-gainer"],
    shortDescription: "High-calorie nutrition for clean weight gain.",
    tone: "#6f4d37"
  },
  {
    id: 16,
    sku: "IR-ALPHAGRID-PRE-WORKOUT",
    slug: "alphagrid-pre-workout",
    name: "AlphaGrid Pre-Workout",
    tag: "Pre Workout",
    price: "₹1,874",
    mrp: "₹2,499",
    image: "https://admin.ironrootnutrition.com/wp-content/uploads/2026/06/Alphagrid_Pre_Workout-Citrus_Blitz_30_Servings_Front.jpg",
    categoryNames: ["Pre Workout"],
    categorySlugs: ["pre-workout"],
    shortDescription: "Alpha-level energy for intense workouts.",
    tone: "#e5752d"
  }
];

export const flavourTiles = [
  {
    title: "Pista Kulfi Flavour",
    aliases: ["tital meal", "titan meal", "meal mass gainer", "mass gainer"],
    image:
      "https://admin.ironrootnutrition.com/wp-content/uploads/2026/07/ChatGPT-Image-Jul-1-2026-03_51_43-PM.png",
    href: "#products"
  },
  {
    title: "Espresso Coffee Flavour",
    aliases: ["pro fusion", "profusion"],
    image:
      "https://admin.ironrootnutrition.com/wp-content/uploads/2026/06/ChatGPT-Image-Jun-19-2026-11_42_22-AM.png",
    href: "#products"
  },
  {
    title: "Orange Burst Flavour",
    aliases: ["pre shock", "preshock", "pre-shock"],
    image:
      "https://admin.ironrootnutrition.com/wp-content/uploads/2026/06/ChatGPT-Image-Jun-19-2026-12_00_52-PM.png",
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
    slug: "protein-timing-for-better-recovery",
    title: "Protein timing for better recovery",
    image:
      "https://admin.ironrootnutrition.com/wp-content/uploads/2026/06/ChatGPT-Image-Jun-11-2026-03_23_39-PM-1.png",
    date: "11 Jun 2026",
    author: "IronRoot Team",
    badge: "Recovery",
    readTime: "7 min read",
    excerpt: "A practical way to place protein around training without turning every meal into a calculation.",
    sections: [
      {
        heading: "Start with the full day",
        body: [
          "The most useful starting point is the full day, not one perfect post-workout minute. Protein timing can make a routine cleaner, but it cannot fix a day where total protein intake is too low.",
          "Most active people do better when protein is split across three to five meals or servings. That pattern gives the body repeated opportunities to support repair, helps appetite feel steadier, and makes the routine easier to repeat.",
          "Think of timing as structure. It helps you place protein where your day already has natural breaks instead of forcing a complicated schedule."
        ]
      },
      {
        heading: "Why meal spacing matters",
        body: [
          "A single large protein-heavy meal can still count toward your day, but it is not always the easiest way to recover from regular training. Smaller planned servings are usually easier to digest and easier to match with work, travel, and training hours.",
          "Spacing protein also helps you notice when a meal is missing enough support. Breakfast, lunch, dinner, and one shake can be a simple framework for many lifters.",
          "The goal is not to eat constantly. The goal is to avoid long gaps where training recovery has very little nutritional support."
        ]
      },
      {
        heading: "Before training",
        body: [
          "A pre-workout meal does not need to be heavy. If you train within two to three hours after a normal meal, that meal can already support the session well.",
          "If you train early in the morning or after a long gap, a lighter option can help. A small protein serving with a simple carbohydrate source is often easier than forcing a full meal too close to training.",
          "Comfort matters here. A serving that feels good during squats, running, or high intensity work is more useful than a theoretically perfect meal that sits too heavy."
        ]
      },
      {
        heading: "After training",
        body: [
          "The post-workout window is best treated as a practical reminder. After training, your next meal should include quality protein, but it does not need to become a stressful countdown.",
          "If a proper meal is close, use that meal. If you are travelling, working, or do not feel like eating, a shake can keep the routine on track until the next full meal.",
          "Pairing protein with carbohydrates after hard training can also help refill energy for the next session, especially when training volume is high."
        ]
      },
      {
        heading: "Rest days still count",
        body: [
          "Muscle repair does not stop when the workout ends. Rest days are when the body is still adapting to the work you already did, so protein intake should not disappear on those days.",
          "A rest day does not need a special supplement plan. Keep meals balanced, keep protein consistent, and let sleep and hydration do their part.",
          "This is where simple habits matter. The more normal your rest-day nutrition feels, the easier it is to stay consistent through the week."
        ]
      },
      {
        heading: "Build a routine you can repeat",
        body: [
          "A good routine is one you can follow on busy days. For some people that means breakfast, lunch, dinner, and one shake. For others it means two solid meals, one snack, and a post-workout serving.",
          "Choose foods you already tolerate well. Whey, curd, eggs, paneer, chicken, fish, dal, tofu, or soy can all fit depending on preference and diet style.",
          "The best protein timing plan is not the most complex one. It is the one that keeps showing up when work, travel, and training all compete for attention."
        ]
      }
    ]
  },
  {
    slug: "creatine-monohydrate-for-daily-strength",
    title: "Creatine monohydrate for daily strength",
    image:
      "https://admin.ironrootnutrition.com/wp-content/uploads/2026/06/ChatGPT-Image-Jun-11-2026-03_29_27-PM.png",
    date: "11 Jun 2026",
    author: "IronRoot Team",
    badge: "Creatine",
    readTime: "7 min read",
    excerpt: "How to use creatine monohydrate in a simple daily routine for strength and repeated effort.",
    sections: [
      {
        heading: "What creatine supports",
        body: [
          "Creatine monohydrate is popular because it fits the way strength training actually works. Many gym sessions depend on short bursts of effort, repeated sets, and the ability to push hard again after a short rest.",
          "It is not a stimulant and it is not meant to feel like a pre-workout rush. Its value comes from regular use over time, where it supports the training system behind repeated high effort work.",
          "That makes it especially useful for lifters, sprinters, field sport athletes, and anyone trying to improve performance in repeated intense efforts."
        ]
      },
      {
        heading: "Daily consistency is the main rule",
        body: [
          "Creatine works best when it becomes a simple daily habit. The exact time is less important than taking it consistently enough for your routine to stay steady.",
          "Many people place it with breakfast, with a post-workout shake, or with the same meal every day. Linking it to an existing habit makes it harder to forget.",
          "You do not need to redesign your whole supplement stack around it. A small daily serving and a normal training plan are enough for most routines."
        ]
      },
      {
        heading: "Workout days and rest days",
        body: [
          "On workout days, creatine can be taken before or after training. If you already have a shake after training, adding it there is convenient and easy to remember.",
          "On rest days, take it with any regular meal. Rest days are still part of the same weekly training cycle, so keeping the habit active makes more sense than skipping randomly.",
          "The point is to make the routine boring in a good way. When the habit is simple, you do not waste energy deciding what to do every day."
        ]
      },
      {
        heading: "Pair it with progressive training",
        body: [
          "Creatine cannot replace effort, sleep, food, or a planned training progression. It works best when your sessions already include measurable work such as sets, reps, load, speed, or total volume.",
          "If training is random, it becomes harder to notice the benefit of any supplement. A logbook or simple tracking app can help you see whether strength, reps, or repeat effort is improving.",
          "Use creatine as support for the plan, not as the plan itself. The main driver is still consistent training."
        ]
      },
      {
        heading: "Hydration and comfort",
        body: [
          "Creatine is easy to use with water, juice, or a shake. Mix it properly and drink enough water through the day, especially if your training is sweaty or high volume.",
          "Some people prefer taking it with a meal because it feels better on the stomach. If one timing feels uncomfortable, move it to another meal instead of quitting the habit immediately.",
          "Simple comfort checks matter. A supplement routine should support training, not make digestion or daily scheduling harder."
        ]
      },
      {
        heading: "What to expect over time",
        body: [
          "Creatine is not usually something you judge from one workout. Give the routine time and look for changes in repeated effort, set quality, and the ability to maintain performance across a session.",
          "You may notice small changes in scale weight because creatine can support water storage inside muscle. That is different from fat gain and should be interpreted in the context of training and diet.",
          "Keep expectations realistic. Creatine can help support performance, but the visible result still depends on months of training consistency."
        ]
      }
    ]
  },
  {
    slug: "protein-support-without-overcomplication",
    title: "Protein support without overcomplication",
    image:
      "https://admin.ironrootnutrition.com/wp-content/uploads/2026/06/ChatGPT-Image-Jun-11-2026-03_23_40-PM-3.png",
    date: "11 Jun 2026",
    author: "IronRoot Team",
    badge: "Training",
    readTime: "7 min read",
    excerpt: "A clear way to use protein supplements only where they actually make your day easier.",
    sections: [
      {
        heading: "Start with real meals",
        body: [
          "Protein supplements work best when they support a food routine that already makes sense. They are not a replacement for meals, vegetables, carbohydrates, fats, hydration, or sleep.",
          "Look at your normal day first. If breakfast has almost no protein, lunch is inconsistent, and dinner is your only strong meal, the issue is not a lack of complexity. It is a lack of structure.",
          "Once meals are clearer, a supplement can fill the gap without taking over the whole plan."
        ]
      },
      {
        heading: "Use supplements where they solve a problem",
        body: [
          "A protein shake is useful when it solves a real problem: missed meals, low protein intake, travel, late training, or a schedule that makes cooking difficult.",
          "It is less useful when it is added on top of an already complete day without a reason. More is not automatically better, and extra servings can crowd out regular food.",
          "Ask a simple question before adding a serving: what gap is this solving today? If the answer is clear, the supplement has a place."
        ]
      },
      {
        heading: "Match the plan to your goal",
        body: [
          "For lean muscle, protein supports repair and growth, but it still needs progressive training and enough total food. A shake alone cannot create a training result if the workouts are not moving forward.",
          "For weight gain, protein matters, but total calories matter too. This is where mass gainers or larger meals can help people who struggle to eat enough food consistently.",
          "For general fitness, the goal may simply be easier recovery and better daily balance. In that case, a straightforward whey or protein-rich meal may be enough."
        ]
      },
      {
        heading: "Choose a serving that fits your day",
        body: [
          "The best serving size is the one that fits your daily target and digestion. Some people do well with one scoop after training. Others split intake across meals and only use a shake on busy days.",
          "Do not copy someone else's exact routine without checking your own food intake, body weight, appetite, and training schedule. Two people can use the same product in different ways and both be correct.",
          "Keep the serving practical. If the routine feels difficult every day, it will probably not last."
        ]
      },
      {
        heading: "Pay attention to digestion",
        body: [
          "A supplement should feel easy to use. If a serving feels too heavy, try it with more water, place it farther from training, or use it with a meal instead of on an empty stomach.",
          "Flavour also matters more than people admit. A product you dislike will eventually become a product you avoid, even if the label looks good.",
          "Routine quality includes comfort. The easier it is to drink, digest, and repeat, the more useful it becomes."
        ]
      },
      {
        heading: "Keep the decision simple",
        body: [
          "You do not need a complicated supplement shelf to train well. Start with food, identify the gap, choose a product that solves that gap, and repeat the routine long enough to judge it fairly.",
          "Look at protein per serving, serving size, taste, mixability, and how it fits your goal. Those basics matter more than chasing every new claim or trend.",
          "The strongest routine is usually the clearest one. When the plan is simple, you can focus more on training, sleep, and showing up consistently."
        ]
      }
    ]
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
