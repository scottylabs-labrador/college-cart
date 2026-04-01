type StorageObject = { url?: string; base64?: string; type?: string; key?: string };

const FALLBACK_IMAGE = "/scotty-tote-dummy.jpg";

function extractKey(storage: StorageObject | undefined | null): string | null {
  if (!storage) return null;
  const isTigrisUrl = storage.url?.includes("tigris.dev");
  return storage.key || (isTigrisUrl ? storage.url?.split(".dev/").pop() ?? null : null);
}

function resolveLocal(storage: StorageObject): string {
  if (storage.url) return storage.url;
  if (storage.base64) return `data:${storage.type || "image/jpeg"};base64,${storage.base64}`;
  return FALLBACK_IMAGE;
}

/**
 * Helper to get a usable image URL from a listing image storage object.
 * If the image is stored in Tigris (private bucket), it fetches a presigned URL.
 */
export async function getImageUrl(storage: StorageObject): Promise<string> {
  if (!storage) return FALLBACK_IMAGE;

  const key = extractKey(storage);

  if (key) {
    try {
      const res = await fetch(`/api/images?key=${encodeURIComponent(key)}`);
      const data = await res.json();
      if (data.url) return data.url;
    } catch (e) {
      console.error("Failed to fetch presigned URL for", key, e);
    }
  }

  return resolveLocal(storage);
}

/**
 * Batch-resolve image URLs for multiple storage objects in a single round-trip.
 * Keys that need presigned URLs are fetched via /api/images/batch; others resolve locally.
 */
export async function getImageUrlsBatch(
  storageObjects: (StorageObject | undefined | null)[]
): Promise<string[]> {
  const keys: (string | null)[] = storageObjects.map(extractKey);
  const uniqueKeys = [...new Set(keys.filter((k): k is string => k !== null))];

  let presignedMap: Record<string, string> = {};

  if (uniqueKeys.length > 0) {
    try {
      const res = await fetch("/api/images/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keys: uniqueKeys }),
      });
      const data = await res.json();
      presignedMap = data.urls ?? {};
    } catch (e) {
      console.error("Failed to fetch batch presigned URLs", e);
    }
  }

  return storageObjects.map((storage, i) => {
    if (!storage) return FALLBACK_IMAGE;
    const key = keys[i];
    if (key && presignedMap[key]) return presignedMap[key];
    return resolveLocal(storage);
  });
}
