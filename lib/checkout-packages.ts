import { getAllProducts } from "@/lib/woocommerce";
import type { CheckoutOrderItem } from "@/lib/checkout-orders";
import type { ProductPackage } from "@/lib/home-data";

export type CheckoutPackageLine = {
  productId: number | string;
  variationId?: number | string;
  name: string;
  quantity: number;
  weightKg: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
};

export type CheckoutPackageSummary = {
  weightUnit: "kg";
  dimensionUnit: "cm";
  totalActualWeightKg: number;
  volumetricWeightKg: number;
  chargeableWeightKg: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  lines: CheckoutPackageLine[];
};

function getQuantity(value: unknown) {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(1, Math.min(99, Math.floor(value)))
    : 1;
}

function roundPackageValue(value: number) {
  return Number(value.toFixed(3));
}

function getPackageValues(packaging?: ProductPackage) {
  if (!packaging) {
    return null;
  }

  const { weight, dimensions } = packaging;

  if (
    !Number.isFinite(weight) ||
    weight <= 0 ||
    !Number.isFinite(dimensions.length) ||
    dimensions.length <= 0 ||
    !Number.isFinite(dimensions.width) ||
    dimensions.width <= 0 ||
    !Number.isFinite(dimensions.height) ||
    dimensions.height <= 0
  ) {
    return null;
  }

  return {
    weightKg: weight,
    lengthCm: dimensions.length,
    widthCm: dimensions.width,
    heightCm: dimensions.height
  };
}

export async function calculateCheckoutPackageSummary(
  items: CheckoutOrderItem[]
): Promise<CheckoutPackageSummary> {
  if (items.length === 0) {
    throw new Error("Cart is empty.");
  }

  const products = await getAllProducts(100, { includeVariations: true });
  const lines = items.map((item) => {
    const product = products.find((candidate) => {
      return (
        (item.id !== undefined && String(candidate.id) === String(item.id)) ||
        (item.variationId !== undefined &&
          candidate.variations?.some((variation) => String(variation.id) === String(item.variationId))) ||
        (item.href && candidate.href === item.href) ||
        (item.name && candidate.name === item.name)
      );
    });

    if (!product) {
      throw new Error(`Could not validate cart item: ${item.name ?? "Unknown product"}.`);
    }

    const variation = item.variationId !== undefined
      ? product.variations?.find((candidate) => String(candidate.id) === String(item.variationId))
      : undefined;

    if (item.variationId !== undefined && !variation) {
      throw new Error(`Could not validate selected variation for ${item.name ?? product.name}.`);
    }

    const packageValues = getPackageValues(variation?.package ?? product.package);

    if (!packageValues) {
      throw new Error(`Package weight and dimensions are required for ${item.name ?? product.name}.`);
    }

    const quantity = getQuantity(item.quantity);

    return {
      productId: product.id ?? item.id ?? product.name,
      variationId: variation?.id ?? item.variationId,
      name: product.name,
      quantity,
      ...packageValues
    };
  });
  const totalActualWeightKg = lines.reduce((total, line) => total + line.weightKg * line.quantity, 0);
  const lengthCm = Math.max(...lines.map((line) => line.lengthCm));
  const widthCm = Math.max(...lines.map((line) => line.widthCm));
  const heightCm = Math.max(...lines.map((line) => line.heightCm));
  const volumetricWeightKg = (lengthCm * widthCm * heightCm) / 5000;

  return {
    weightUnit: "kg",
    dimensionUnit: "cm",
    totalActualWeightKg: roundPackageValue(totalActualWeightKg),
    volumetricWeightKg: roundPackageValue(volumetricWeightKg),
    chargeableWeightKg: roundPackageValue(Math.max(totalActualWeightKg, volumetricWeightKg)),
    lengthCm,
    widthCm,
    heightCm,
    lines
  };
}
