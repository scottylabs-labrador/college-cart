/**
 * Helper to get a usable image URL from a listing image storage object.
 * If the image is stored in Tigris (private bucket), it fetches a presigned URL.
 */
export async function getImageUrl(storage: { url?: string; base64?: string; type?: string; key?: string }): Promise<string> {
  if (!storage) return "/scotty-tote-dummy.jpg";

  // If it's a Tigris image (has a key or is a Tigris URL), get a presigned URL
  const isTigrisUrl = storage.url?.includes("tigris.dev");
  const key = storage.key || (isTigrisUrl ? storage.url?.split(".dev/").pop() : null);

  if (key) {
    try {
      const res = await fetch(`/api/images?key=${encodeURIComponent(key)}`);
      const data = await res.json();
      if (data.url) return data.url;
    } catch (e) {
      console.error("Failed to fetch presigned URL for", key, e);
    }
  }

  // Fallback to existing URL or base64
  if (storage.url) {
    return storage.url;
  } else if (storage.base64) {
    return `data:${storage.type || "image/jpeg"};base64,${storage.base64}`;
  }

  return "/scotty-tote-dummy.jpg";
}
