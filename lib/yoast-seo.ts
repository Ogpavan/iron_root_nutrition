import type { Metadata } from "next";

type YoastImage = {
  url?: string;
  width?: number;
  height?: number;
  alt?: string;
};

type YoastHeadJson = {
  title?: string;
  description?: string;
  canonical?: string;
  og_title?: string;
  og_description?: string;
  og_type?: string;
  og_url?: string;
  og_site_name?: string;
  og_image?: YoastImage[];
  twitter_card?: "summary" | "summary_large_image" | "player" | "app";
};

type YoastRestItem = {
  yoast_head_json?: YoastHeadJson | null;
};

function getWordPressSiteUrl() {
  const siteUrl = process.env.WORDPRESS_SITE_URL;

  if (!siteUrl) {
    return undefined;
  }

  try {
    return new URL(siteUrl);
  } catch {
    return undefined;
  }
}

function mapYoastImage(image: YoastImage) {
  if (!image.url) {
    return undefined;
  }

  return {
    url: image.url,
    width: image.width,
    height: image.height,
    alt: image.alt
  };
}

function isYoastMetadataImage(
  image: ReturnType<typeof mapYoastImage>
): image is NonNullable<ReturnType<typeof mapYoastImage>> {
  return Boolean(image);
}

export function mapYoastToMetadata(yoast?: YoastHeadJson | null): Metadata | null {
  if (!yoast) {
    return null;
  }

  const openGraphImages = yoast.og_image?.map(mapYoastImage).filter(isYoastMetadataImage);

  return {
    title: yoast.title,
    description: yoast.description || yoast.og_description,
    openGraph: {
      title: yoast.og_title || yoast.title,
      description: yoast.og_description || yoast.description,
      type: yoast.og_type === "article" ? "article" : "website",
      url: yoast.og_url,
      siteName: yoast.og_site_name,
      images: openGraphImages
    },
    twitter: {
      card: yoast.twitter_card || "summary_large_image",
      title: yoast.og_title || yoast.title,
      description: yoast.og_description || yoast.description,
      images: openGraphImages?.map((image) => image.url)
    }
  };
}

export async function getYoastMetadataBySlug(
  restBase: "pages" | "posts" | "product",
  slug: string
): Promise<Metadata | null> {
  const siteUrl = getWordPressSiteUrl();

  if (!siteUrl || !slug) {
    return null;
  }

  const endpoint = new URL(`/wp-json/wp/v2/${restBase}`, siteUrl);
  endpoint.searchParams.set("slug", slug);
  endpoint.searchParams.set("per_page", "1");

  try {
    const response = await fetch(endpoint, {
      next: {
        revalidate: 300
      }
    });

    if (!response.ok) {
      return null;
    }

    const data: unknown = await response.json();

    if (!Array.isArray(data)) {
      return null;
    }

    return mapYoastToMetadata((data[0] as YoastRestItem | undefined)?.yoast_head_json);
  } catch {
    return null;
  }
}
