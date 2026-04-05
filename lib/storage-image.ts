export type StorageObject = { url?: string; type?: string; key?: string };

export const STORAGE_FALLBACK_IMAGE = "/scotty-tote-dummy.jpg";

function isPrivateStorageHost(hostname: string): boolean {
  return (
    hostname.endsWith(".tigris.dev") ||
    hostname.endsWith(".storageapi.dev")
  );
}

/** True when URL already includes AWS SigV4 (or similar) query params. */
export function urlLooksPresigned(url: string): boolean {
  return (
    url.includes("X-Amz-Algorithm=") ||
    url.includes("X-Amz-Signature=") ||
    url.includes("X-Amz-Credential=")
  );
}

/**
 * Object key for S3/Tigris GetObject, from explicit `key` or private storage URL path.
 */
export function extractObjectKey(
  storage: StorageObject | undefined | null
): string | null {
  if (!storage) return null;
  if (storage.key) return storage.key;
  const u = storage.url;
  if (!u) return null;
  try {
    const parsed = new URL(u);
    if (!isPrivateStorageHost(parsed.hostname)) return null;
    const path = parsed.pathname.replace(/^\//, "");
    return path || null;
  } catch {
    return null;
  }
}

/**
 * Only returns `storage.url` when it is safe to fetch without signing (public or already presigned).
 */
export function safePublicImageUrl(
  storage: StorageObject | undefined | null
): string | null {
  if (!storage?.url) return null;
  const u = storage.url;
  if (urlLooksPresigned(u)) return u;
  try {
    const parsed = new URL(u);
    if (isPrivateStorageHost(parsed.hostname)) return null;
    return u;
  } catch {
    return null;
  }
}

/** Use with next/image: remote URLs (presigned) should not go through the optimizer. */
export function isRemoteImageSrc(src: string): boolean {
  return src.startsWith("http://") || src.startsWith("https://");
}
