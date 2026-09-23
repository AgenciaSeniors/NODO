import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { PLANS } from "@/lib/catalog";
import { DEMO_STORES, DEMO_USER } from "@/lib/demo/data";
import { initials } from "@/lib/format";
import { DEMO_MODE } from "@/lib/mode";
import { createClient } from "@/lib/supabase/server";
import { STORE_COLUMNS, toStore, type StoreRow } from "@/lib/supabase/rows";
import type { PlanId, Store } from "@/lib/types";

/** The signed-in person, as the pages need them. */
export type Viewer = {
  id: string;
  email?: string;
  name: string;
  initials: string;
  verified: boolean;
  rating?: number;
  provinceId?: string;
  municipalityId?: string;
  plan: { id: PlanId; name: string; limit: number; activeListings: number };
  stores: Store[];
};

function demoViewer(): Viewer {
  return {
    id: "demo",
    name: DEMO_USER.name,
    initials: DEMO_USER.initials,
    verified: DEMO_USER.verified,
    rating: DEMO_USER.rating,
    provinceId: DEMO_USER.provinceId,
    plan: { id: "gratis", ...PLANS.gratis, activeListings: DEMO_USER.plan.activeListings },
    stores: DEMO_STORES.filter((s) => DEMO_USER.storeIds.includes(s.id)),
  };
}

/** Who is signed in, or null. Checked once per request. */
export const getViewer = cache(async (): Promise<Viewer | null> => {
  if (DEMO_MODE) return demoViewer();

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const userId = auth?.claims?.sub;
  if (!userId) return null;

  const [profile, memberships, active] = await Promise.all([
    supabase.from("profiles").select("full_name, province_id, municipality_id, plan, verified").eq("id", userId).maybeSingle(),
    supabase
      .from("store_members")
      .select(`store:stores (${STORE_COLUMNS}, products (count))`)
      .eq("user_id", userId)
      .order("created_at"),
    supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("owner_user_id", userId)
      .in("availability", ["available", "reserved"]),
  ]);
  for (const [what, result] of [["profile", profile], ["stores", memberships], ["listings", active]] as const) {
    if (result.error) console.error(`[supabase] viewer ${what}: ${result.error.message}`);
  }

  const name = (profile.data?.full_name as string | undefined)?.trim() ?? "";
  const planId = (profile.data?.plan as PlanId | undefined) ?? "gratis";
  const rows = (memberships.data ?? []) as unknown as Array<{ store: StoreRow | null }>;
  return {
    id: userId,
    email: typeof auth.claims.email === "string" ? auth.claims.email : undefined,
    name,
    initials: initials(name) || "?",
    verified: Boolean(profile.data?.verified),
    provinceId: (profile.data?.province_id as string | null) ?? undefined,
    municipalityId: (profile.data?.municipality_id as string | null) ?? undefined,
    plan: { id: planId, ...PLANS[planId], activeListings: active.count ?? 0 },
    stores: rows.flatMap((r) => (r.store ? [toStore(r.store)] : [])),
  };
});

/**
 * For pages that need an account: sends visitors to /entrar and brings them
 * back afterwards. New accounts first say how they want to be called.
 */
export async function requireViewer(returnTo: string): Promise<Viewer> {
  const viewer = await getViewer();
  const back = new URLSearchParams({ volver: returnTo });
  if (!viewer) redirect(`/entrar?${back}`);
  if (!viewer.name) redirect(`/entrar/nombre?${back}`);
  return viewer;
}
