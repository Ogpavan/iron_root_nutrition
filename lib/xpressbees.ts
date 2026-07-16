import "server-only";

type XpressBeesLoginResponse = {
  status?: boolean;
  data?: unknown;
  message?: string;
};

type XpressBeesServiceabilityResponse = {
  status?: boolean;
  data?: unknown;
  message?: string;
};

type XpressBeesShipmentResponse = {
  status?: boolean;
  data?: {
    order_id?: number | string;
    shipment_id?: number | string;
    awb_number?: string;
    courier_id?: number | string;
    courier_name?: string;
    status?: string;
    additional_info?: string;
    payment_type?: string;
    label?: string;
  };
  message?: string;
};

type XpressBeesTrackResponse = {
  status?: boolean;
  data?: {
    awb_number?: string;
    status?: string;
    shipment_info?: string;
    courier_id?: number | string;
    history?: {
      status_code?: string;
      location?: string;
      event_time?: string;
      message?: string;
    }[];
  };
  message?: string;
};

export type XpressBeesWarehouseConfig = {
  name: string;
  contactName: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
};

export type XpressBeesRate = {
  courierId: string;
  courierName: string;
  freightCharges: number;
  codCharges: number;
  totalCharges: number;
  minWeightGrams?: number;
  chargeableWeightGrams?: number;
};

export type XpressBeesShipmentInput = {
  orderNumber: string;
  paymentType: "cod" | "prepaid";
  orderAmount: number;
  collectableAmount: number;
  shippingCharges: number;
  discount: number;
  codCharges: number;
  packageWeightGrams: number;
  packageLengthCm: number;
  packageBreadthCm: number;
  packageHeightCm: number;
  consignee: {
    name: string;
    companyName?: string;
    address: string;
    address2?: string;
    city: string;
    state: string;
    pincode: string;
    phone: string;
  };
  orderItems: {
    name: string;
    quantity: number;
    price: number;
    sku?: string;
  }[];
  courierId?: string;
};

export type XpressBeesShipment = {
  orderId?: string;
  shipmentId?: string;
  awbNumber?: string;
  courierId?: string;
  courierName?: string;
  status?: string;
  additionalInfo?: string;
  paymentType?: string;
  label?: string;
};

export type XpressBeesTracking = {
  awbNumber?: string;
  status?: string;
  statusCode?: string;
  statusLabel: string;
  location?: string;
  eventTime?: string;
  message?: string;
  shipmentInfo?: string;
  courierId?: string;
};

function getRequiredEnv(name: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} is not configured.`);
  }

  return value;
}

export function getXpressBeesWarehouseConfig(): XpressBeesWarehouseConfig {
  return {
    name: getRequiredEnv("XPRESSBEES_WAREHOUSE_NAME"),
    contactName: getRequiredEnv("XPRESSBEES_WAREHOUSE_CONTACT_NAME"),
    address: getRequiredEnv("XPRESSBEES_WAREHOUSE_ADDRESS"),
    city: getRequiredEnv("XPRESSBEES_WAREHOUSE_CITY"),
    state: getRequiredEnv("XPRESSBEES_WAREHOUSE_STATE"),
    pincode: getRequiredEnv("XPRESSBEES_WAREHOUSE_PINCODE"),
    phone: getRequiredEnv("XPRESSBEES_WAREHOUSE_PHONE")
  };
}

export async function getXpressBeesToken() {
  const email = getRequiredEnv("XPRESSBEES_EMAIL");
  const password = getRequiredEnv("XPRESSBEES_PASSWORD");
  const response = await fetch("https://shipment.xpressbees.com/api/users/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ email, password }),
    cache: "no-store"
  });
  const data = (await response.json().catch(() => null)) as XpressBeesLoginResponse | null;
  const token = typeof data?.data === "string" ? data.data.trim() : "";

  if (!response.ok || !data?.status || !token) {
    throw new Error(data?.message || "Could not authenticate with XpressBees.");
  }

  return token;
}

function toPositiveNumber(value: unknown) {
  const parsed = Number(value);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function cleanDigits(value: string, maxLength?: number) {
  const digits = value.replace(/\D/g, "");

  return maxLength ? digits.slice(0, maxLength) : digits;
}

function cleanPhone(value: string) {
  return value.replace(/\D/g, "").slice(-10);
}

function cleanAwb(value: string) {
  return value.replace(/[^a-zA-Z0-9]/g, "");
}

function limitLength(value: string, maxLength: number) {
  return value.trim().slice(0, maxLength);
}

async function postXpressBees<T>(path: string, body: unknown): Promise<T> {
  const token = await getXpressBeesToken();
  const response = await fetch(`https://shipment.xpressbees.com/api${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body),
    cache: "no-store"
  });
  const data = (await response.json().catch(() => null)) as T & { message?: string; status?: boolean };

  if (!response.ok) {
    throw new Error(data?.message || "XpressBees request failed.");
  }

  return data;
}

async function getXpressBees<T>(path: string): Promise<T> {
  const token = await getXpressBeesToken();
  const response = await fetch(`https://shipment.xpressbees.com/api${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    cache: "no-store"
  });
  const data = (await response.json().catch(() => null)) as T & { message?: string; status?: boolean };

  if (!response.ok) {
    throw new Error(data?.message || "XpressBees request failed.");
  }

  return data;
}

function getTrackingStatusLabel(value?: string) {
  const normalized = value?.trim().toUpperCase();

  switch (normalized) {
    case "PP":
      return "Pending pickup";
    case "IT":
      return "In transit";
    case "EX":
      return "Delivery issue";
    case "FD":
      return "Out for delivery";
    case "DL":
      return "Delivered";
    case "RT":
      return "Returning";
    case "RT-IT":
      return "Return in transit";
    case "RT-DL":
      return "Returned";
    case "RTO":
      return "Returning";
    case "CANCEL":
    case "CANCELED":
    case "CANCELLED":
      return "Cancelled";
    default:
      return value
        ? value
            .split(/[-_\s]+/)
            .filter(Boolean)
            .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
            .join(" ")
        : "Tracking available";
  }
}

export async function getXpressBeesServiceabilityRates(input: {
  destinationPincode: string;
  paymentType: "cod" | "prepaid";
  orderAmount: number;
  weightGrams: number;
  lengthCm: number;
  breadthCm: number;
  heightCm: number;
}) {
  const warehouse = getXpressBeesWarehouseConfig();
  const data = await postXpressBees<XpressBeesServiceabilityResponse>("/courier/serviceability", {
    origin: cleanDigits(warehouse.pincode, 6),
    destination: cleanDigits(input.destinationPincode, 6),
    payment_type: input.paymentType,
    order_amount: String(Math.round(input.orderAmount)),
    weight: String(Math.max(1, Math.ceil(input.weightGrams))),
    length: String(Math.max(1, Math.ceil(input.lengthCm))),
    breadth: String(Math.max(1, Math.ceil(input.breadthCm))),
    height: String(Math.max(1, Math.ceil(input.heightCm)))
  });

  if (!data.status || !Array.isArray(data.data)) {
    throw new Error(data.message || "XpressBees serviceability check failed.");
  }

  return data.data.map((rate): XpressBeesRate => {
    const item = rate as {
      id?: unknown;
      name?: unknown;
      freight_charges?: unknown;
      cod_charges?: unknown;
      total_charges?: unknown;
      min_weight?: unknown;
      chargeable_weight?: unknown;
    };

    return {
      courierId: String(item.id ?? ""),
      courierName: String(item.name ?? "XpressBees"),
      freightCharges: toPositiveNumber(item.freight_charges),
      codCharges: toPositiveNumber(item.cod_charges),
      totalCharges: toPositiveNumber(item.total_charges),
      minWeightGrams: toPositiveNumber(item.min_weight) || undefined,
      chargeableWeightGrams: toPositiveNumber(item.chargeable_weight) || undefined
    };
  }).filter((rate) => Boolean(rate.courierId && rate.totalCharges > 0));
}

export async function createXpressBeesShipment(input: XpressBeesShipmentInput): Promise<XpressBeesShipment> {
  const warehouse = getXpressBeesWarehouseConfig();
  const data = await postXpressBees<XpressBeesShipmentResponse>("/shipments2", {
    order_number: limitLength(input.orderNumber, 20),
    shipping_charges: Number(input.shippingCharges.toFixed(2)),
    discount: Number(input.discount.toFixed(2)),
    cod_charges: Number(input.codCharges.toFixed(2)),
    payment_type: input.paymentType,
    order_amount: Number(input.orderAmount.toFixed(2)),
    package_weight: Math.max(1, Math.ceil(input.packageWeightGrams)),
    package_length: Math.max(1, Math.ceil(input.packageLengthCm)),
    package_breadth: Math.max(1, Math.ceil(input.packageBreadthCm)),
    package_height: Math.max(1, Math.ceil(input.packageHeightCm)),
    request_auto_pickup: "yes",
    consignee: {
      name: limitLength(input.consignee.name, 200),
      company_name: input.consignee.companyName ? limitLength(input.consignee.companyName, 200) : undefined,
      address: limitLength(input.consignee.address, 200),
      address_2: input.consignee.address2 ? limitLength(input.consignee.address2, 200) : undefined,
      city: limitLength(input.consignee.city, 40),
      state: limitLength(input.consignee.state, 40),
      pincode: cleanDigits(input.consignee.pincode, 6),
      phone: cleanPhone(input.consignee.phone)
    },
    pickup: {
      warehouse_name: limitLength(warehouse.name, 20),
      name: limitLength(warehouse.contactName, 200),
      address: limitLength(warehouse.address, 200),
      city: limitLength(warehouse.city, 40),
      state: limitLength(warehouse.state, 40),
      pincode: cleanDigits(warehouse.pincode, 6),
      phone: cleanPhone(warehouse.phone)
    },
    order_items: input.orderItems.map((item) => ({
      name: limitLength(item.name, 200),
      qty: String(item.quantity),
      price: String(Number(item.price.toFixed(2))),
      sku: item.sku ? limitLength(item.sku, 100) : undefined
    })),
    ...(input.courierId ? { courier_id: input.courierId } : {}),
    collectable_amount: String(Number(input.collectableAmount.toFixed(2)))
  });

  if (!data.status || !data.data) {
    throw new Error(data.message || "XpressBees shipment creation failed.");
  }

  return {
    orderId: data.data.order_id === undefined ? undefined : String(data.data.order_id),
    shipmentId: data.data.shipment_id === undefined ? undefined : String(data.data.shipment_id),
    awbNumber: data.data.awb_number,
    courierId: data.data.courier_id === undefined ? undefined : String(data.data.courier_id),
    courierName: data.data.courier_name,
    status: data.data.status,
    additionalInfo: data.data.additional_info,
    paymentType: data.data.payment_type,
    label: data.data.label
  };
}

export async function getXpressBeesTracking(awbNumber: string): Promise<XpressBeesTracking> {
  const awb = cleanAwb(awbNumber);

  if (!awb) {
    throw new Error("XpressBees AWB number is missing.");
  }

  const data = await getXpressBees<XpressBeesTrackResponse>(`/shipments2/track/${encodeURIComponent(awb)}`);

  if (!data.status || !data.data) {
    throw new Error(data.message || "XpressBees tracking was not found.");
  }

  const latestEvent = Array.isArray(data.data.history) && data.data.history.length > 0
    ? data.data.history[data.data.history.length - 1]
    : undefined;
  const shipmentStatus = data.data.status?.trim();
  const statusCode = shipmentStatus?.toLowerCase().startsWith("cancel")
    ? shipmentStatus
    : latestEvent?.status_code || shipmentStatus;

  return {
    awbNumber: data.data.awb_number || awb,
    status: data.data.status,
    statusCode,
    statusLabel: getTrackingStatusLabel(statusCode),
    location: latestEvent?.location,
    eventTime: latestEvent?.event_time,
    message: latestEvent?.message,
    shipmentInfo: data.data.shipment_info,
    courierId: data.data.courier_id === undefined ? undefined : String(data.data.courier_id)
  };
}
