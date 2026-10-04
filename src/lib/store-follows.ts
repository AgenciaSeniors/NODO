// Followed stores live in a cookie, the same way favorites do: no account
// needed, and the server can render the button already filled in.
export const STORE_FOLLOWS_COOKIE = "nodo_siguiendo";
const MAX_FOLLOWS = 60;

export function parseFollows(value: string | undefined | null): string[] {
  if (!value) return [];
  const ids = decodeURIComponent(value)
    .split(".")
    .filter((id) => /^[A-Za-z0-9_-]{1,64}$/.test(id));
  return [...new Set(ids)].slice(-MAX_FOLLOWS);
}

export function serializeFollows(ids: string[]): string {
  return parseFollows(ids.join(".")).join(".");
}

export function toggleFollow(ids: string[], id: string): string[] {
  return ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id];
}
