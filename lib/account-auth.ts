export type AuthUser = {
  name: string;
  identifier: string;
  signedInAt: string;
  email?: string;
  phone?: string;
};

export const accountStorageKey = "ironroot-auth-user";

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
  const fallbackEmail = identifier.includes("@") ? identifier : "";
  const fallbackPhone = identifier.includes("@") ? "" : identifier;
  const email = typeof user.email === "string" ? user.email.trim() : fallbackEmail;
  const phone = typeof user.phone === "string" ? user.phone.trim() : fallbackPhone;

  return {
    name: typeof user.name === "string" && user.name.trim() ? user.name.trim() : user.identifier,
    identifier,
    signedInAt: typeof user.signedInAt === "string" ? user.signedInAt : new Date().toISOString(),
    ...(email ? { email } : {}),
    ...(phone ? { phone } : {})
  };
}
