/**
 * Public origin of the app, used for absolute URLs in share previews.
 * NEXT_PUBLIC_SITE_URL wins; on Vercel the deployment's own domain is used
 * (production domain for production, the preview URL for previews).
 */
export function siteUrl(env: Record<string, string | undefined> = process.env): URL {
  if (env.NEXT_PUBLIC_SITE_URL) return new URL(env.NEXT_PUBLIC_SITE_URL);
  const host =
    env.VERCEL_ENV === "production" ? (env.VERCEL_PROJECT_PRODUCTION_URL ?? env.VERCEL_URL) : env.VERCEL_URL;
  return new URL(host ? `https://${host}` : "http://localhost:3000");
}
