import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "@/lib/supabase/config";

// Keeps the login session fresh: when the access token is about to expire,
// Supabase refreshes it here and the new cookies go back with the response.
export async function proxy(request: NextRequest) {
  // Visitors who never signed in have no auth cookie: nothing to refresh.
  if (!request.cookies.getAll().some((c) => c.name.startsWith("sb-"))) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) response.cookies.set(name, value, options);
        for (const [key, value] of Object.entries(headers ?? {})) response.headers.set(key, value);
      },
    },
  });
  await supabase.auth.getClaims();
  return response;
}

export const config = {
  matcher: [
    // Pages only: skip build assets, images, icons and PWA files.
    "/((?!_next/static|_next/image|fotos/|icons/|brand/|sw.js|manifest.webmanifest|icon.svg|apple-icon.png|.*\\.(?:png|jpg|jpeg|webp|svg|ico)$).*)",
  ],
};
