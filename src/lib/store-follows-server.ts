import { cookies } from "next/headers";
import { STORE_FOLLOWS_COOKIE, parseFollows } from "@/lib/store-follows";

export async function getFollowedStoreIds(): Promise<Set<string>> {
  const store = await cookies();
  return new Set(parseFollows(store.get(STORE_FOLLOWS_COOKIE)?.value));
}
