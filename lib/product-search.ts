import type { HomeProduct } from "@/lib/home-data";

type SearchableProduct = Pick<
  HomeProduct,
  | "name"
  | "tag"
  | "price"
  | "sku"
  | "slug"
  | "shortDescription"
  | "description"
  | "categoryNames"
  | "categorySlugs"
  | "attributes"
  | "defaultAttributes"
>;

export function normalizeProductSearchText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getAttributeText(product: SearchableProduct) {
  const attributes =
    product.attributes?.flatMap((attribute) => [
      attribute.name,
      attribute.slug,
      ...attribute.options
    ]) ?? [];
  const defaultAttributes =
    product.defaultAttributes?.flatMap((attribute) => [
      attribute.name,
      attribute.slug,
      attribute.option
    ]) ?? [];

  return [...attributes, ...defaultAttributes].filter(Boolean);
}

function getSearchDocument(product: SearchableProduct) {
  return normalizeProductSearchText(
    [
      product.name,
      product.tag,
      product.price,
      product.sku,
      product.slug,
      ...(product.categoryNames ?? []),
      ...(product.categorySlugs ?? []),
      ...getAttributeText(product)
    ]
      .filter(Boolean)
      .join(" ")
  );
}

function getSearchTerms(query: string) {
  return normalizeProductSearchText(query).split(" ").filter(Boolean);
}

function uniqueTokens(document: string) {
  return Array.from(new Set(document.split(" ").filter(Boolean)));
}

function getMaxDistance(term: string, token: string) {
  const comparableLength = Math.min(term.length, token.length);

  if (comparableLength < 4) {
    return 0;
  }

  if (comparableLength <= 5) {
    return 1;
  }

  if (comparableLength <= 8) {
    return 2;
  }

  return 3;
}

function boundedLevenshtein(first: string, second: string, maxDistance: number) {
  if (Math.abs(first.length - second.length) > maxDistance) {
    return maxDistance + 1;
  }

  let previous = Array.from({ length: second.length + 1 }, (_, index) => index);

  for (let firstIndex = 1; firstIndex <= first.length; firstIndex += 1) {
    const current = [firstIndex];
    let rowMinimum = current[0];

    for (let secondIndex = 1; secondIndex <= second.length; secondIndex += 1) {
      const cost = first[firstIndex - 1] === second[secondIndex - 1] ? 0 : 1;
      const value = Math.min(
        previous[secondIndex] + 1,
        current[secondIndex - 1] + 1,
        previous[secondIndex - 1] + cost
      );

      current[secondIndex] = value;
      rowMinimum = Math.min(rowMinimum, value);
    }

    if (rowMinimum > maxDistance) {
      return maxDistance + 1;
    }

    previous = current;
  }

  return previous[second.length];
}

function scoreTerm(term: string, document: string, tokens: string[]) {
  if (!term) {
    return 0;
  }

  let bestScore = document.includes(term) ? 82 : 0;
  const compactDocument = document.replace(/\s+/g, "");

  if (term.length >= 3 && compactDocument.includes(term)) {
    bestScore = Math.max(bestScore, 78);
  }

  tokens.forEach((token) => {
    if (token === term) {
      bestScore = Math.max(bestScore, 120);
      return;
    }

    if (token.startsWith(term)) {
      bestScore = Math.max(bestScore, 108);
      return;
    }

    if (token.includes(term)) {
      bestScore = Math.max(bestScore, 94);
      return;
    }

    if (term.length >= 4 && token.length >= 4 && term.startsWith(token)) {
      bestScore = Math.max(bestScore, 72);
    }

    const maxDistance = getMaxDistance(term, token);

    if (maxDistance > 0) {
      const distance = boundedLevenshtein(term, token, maxDistance);

      if (distance <= maxDistance) {
        bestScore = Math.max(bestScore, 76 - distance * 12);
      }
    }

    if (term.length >= 4 && token.length > term.length) {
      const prefixDistance = boundedLevenshtein(term, token.slice(0, term.length), 1);

      if (prefixDistance <= 1) {
        bestScore = Math.max(bestScore, 68 - prefixDistance * 10);
      }
    }
  });

  return bestScore;
}

export function scoreProductSearch(product: SearchableProduct, query: string) {
  const terms = getSearchTerms(query);

  if (terms.length === 0) {
    return 1;
  }

  const document = getSearchDocument(product);
  const tokens = uniqueTokens(document);
  let score = 0;

  for (const term of terms) {
    const termScore = scoreTerm(term, document, tokens);

    if (termScore <= 0) {
      return 0;
    }

    score += termScore;
  }

  if (normalizeProductSearchText(product.name).includes(terms.join(" "))) {
    score += 35;
  }

  return score;
}

export function matchesProductSearch(product: SearchableProduct, query: string) {
  return scoreProductSearch(product, query) > 0;
}

export function sortProductsBySearchRelevance<T extends SearchableProduct>(products: T[], query: string) {
  const normalizedQuery = normalizeProductSearchText(query);

  if (!normalizedQuery) {
    return products;
  }

  return [...products].sort((first, second) => {
    const scoreDifference = scoreProductSearch(second, normalizedQuery) - scoreProductSearch(first, normalizedQuery);

    if (scoreDifference !== 0) {
      return scoreDifference;
    }

    return first.name.localeCompare(second.name);
  });
}
