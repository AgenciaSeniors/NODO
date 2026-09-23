import { cookies } from "next/headers";
import { FAVORITES_COOKIE, parseFavorites } from "@/lib/favorites";

export async function getFavoriteIds(): Promise<Set<string>> {
  const store = await cookies();
  return new Set(parseFavorites(store.get(FAVORITES_COOKIE)?.value));
}
