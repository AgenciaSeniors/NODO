// Saved products live in a cookie so the server can render hearts already
// filled. The cookie rides along with every request (photos included), so it
// stays small: 60 product ids are about 2 KB.
export const FAVORITES_COOKIE = "nodo_favoritos";
const MAX_FAVORITES = 60;

export function parseFavorites(value: string | undefined | null): string[] {
  if (!value) return [];
  const ids = decodeURIComponent(value)
    .split(".")
    .filter((id) => /^[A-Za-z0-9_-]{1,64}$/.test(id));
  return [...new Set(ids)].slice(-MAX_FAVORITES);
}

export function serializeFavorites(ids: string[]): string {
  return parseFavorites(ids.join(".")).join(".");
}

export function toggleFavorite(ids: string[], id: string): string[] {
  return ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id];
}
