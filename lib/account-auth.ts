export type AuthUser = {
  name: string;
  identifier: string;
  signedInAt: string;
  email?: string;
  phone?: string;
};

export const accountStorageKey = "ironroot-auth-user";

export function normalizeAuthEmail(value: string) {
  return value.trim().toLowerCase();
}

export function isValidAuthEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeAuthEmail(value));
}

export function getAuthUserContact(user: AuthUser) {
  const email = isValidAuthEmail(user.email ?? "")
    ? normalizeAuthEmail(user.email ?? "")
    : isValidAuthEmail(user.identifier)
      ? normalizeAuthEmail(user.identifier)
      : "";

  return {
    email,
    phone: user.phone?.trim() ?? ""
  };
}

export function getAccountInitials(user: AuthUser | null) {
  if (!user) {
    return "";
  }

  const source = user.name || user.identifier;
  const parts = source
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) {
    return "";
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function normalizeStoredUser(value: unknown): AuthUser | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const user = value as Partial<AuthUser>;

  if (typeof user.identifier !== "string" || user.identifier.trim().length === 0) {
    return null;
  }

  const identifier = user.identifier.trim();
  const explicitEmail = typeof user.email === "string" ? user.email : "";
  const fallbackEmail = identifier.includes("@") ? identifier : "";
  const email = normalizeAuthEmail(explicitEmail || fallbackEmail);

  if (!isValidAuthEmail(email)) {
    return null;
  }

  const fallbackPhone = identifier.includes("@") ? "" : identifier;
  const phone = typeof user.phone === "string" ? user.phone.trim() : fallbackPhone;

  return {
    name: typeof user.name === "string" && user.name.trim() ? user.name.trim() : email,
    identifier: email,
    signedInAt: typeof user.signedInAt === "string" ? user.signedInAt : new Date().toISOString(),
    email,
    ...(phone ? { phone } : {})
  };
}
