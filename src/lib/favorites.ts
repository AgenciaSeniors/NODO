// Saved products live in a cookie until accounts exist, so the server can
// render hearts already filled and the Favoritos page needs no extra request.
export const FAVORITES_COOKIE = "nodo_favoritos";
const MAX_FAVORITES = 100;

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
