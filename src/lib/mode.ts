/**
 * NODO_MODE=demo runs the app as the clickable prototype: example data only,
 * a pretend signed-in user and forms that don't save. CI and the end-to-end
 * tests use it so they never touch the real database.
 *
 * Otherwise the app is "live": Supabase for accounts and data. Example content
 * keeps showing next to real content (tagged "Ejemplo") until
 * NODO_EXAMPLE_CONTENT=off, so the marketplace doesn't look empty at launch.
 */
export const DEMO_MODE = process.env.NODO_MODE === "demo";
export const SHOW_EXAMPLES = DEMO_MODE || process.env.NODO_EXAMPLE_CONTENT !== "off";

/**
 * How people sign in. "password" (email + password, no email sent) until NODO
 * has its own email sender; "code" (6-digit code by email) once SMTP is set up.
 */
export const LOGIN_METHOD: "password" | "code" = process.env.NODO_LOGIN === "code" ? "code" : "password";
