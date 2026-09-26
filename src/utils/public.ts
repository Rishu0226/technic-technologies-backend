const PRIVATE_KEYS = new Set(["__v", "password", "passwordHash", "resetToken", "internalNotes"]);

function plain(value: unknown): unknown {
  if (value && typeof value === "object" && "toObject" in value && typeof (value as { toObject: () => unknown }).toObject === "function") {
    return (value as { toObject: () => unknown }).toObject();
  }
  return value;
}

export function toPublic(value: unknown): unknown {
  const raw = plain(value);
  if (Array.isArray(raw)) return raw.map((item) => toPublic(item));
  if (!raw || typeof raw !== "object") return raw;
  const copy: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(raw as Record<string, unknown>)) {
    if (PRIVATE_KEYS.has(key)) continue;
    copy[key] = item;
  }
  return copy;
}
