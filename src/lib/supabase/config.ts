// Public by design: the URL and the publishable key identify the project and
// are safe to ship (row level security protects the data). Environment
// variables override them, e.g. to point a branch at another project.
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://zrgbhiiedjybsomqolnx.supabase.co";
export const SUPABASE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "sb_publishable_nwk0FzaEwRKY-yGvgJaJdw_SuHwIkQN";

/** Public URL of a file in a public Storage bucket. */
export function storageUrl(bucket: string, path: string): string {
  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path.split("/").map(encodeURIComponent).join("/")}`;
}
