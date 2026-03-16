export function getUserId(user: unknown): string {
  if (!user || typeof user !== "object") return "";
  const u = user as Record<string, unknown>;

  const id = u.id;
  if (typeof id === "string" && id.length > 0) return id;

  const userId = u.userId;
  if (typeof userId === "string" && userId.length > 0) return userId;

  const nested = u.user;
  if (nested && typeof nested === "object") {
    const n = nested as Record<string, unknown>;
    const nestedId = n.id;
    if (typeof nestedId === "string" && nestedId.length > 0) return nestedId;
  }

  return "";
}

export function nowMs(): number {
  return Date.now();
}

export function errorMessage(e: unknown, fallback: string): string {
  if (!e || typeof e !== "object") return fallback;
  const obj = e as Record<string, unknown>;
  const msg = obj.message;
  return typeof msg === "string" && msg.length > 0 ? msg : fallback;
}

