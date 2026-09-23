"use server";

import { redirect } from "next/navigation";
import type { AuthError } from "@supabase/supabase-js";
import { safeReturnPath } from "@/lib/location";
import { DEMO_MODE } from "@/lib/mode";
import { createClient } from "@/lib/supabase/server";

export type AuthFormState = { error?: string };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function codeStep(email: string, returnTo: string, resent = false) {
  const params = new URLSearchParams({ correo: email, volver: returnTo });
  if (resent) params.set("reenviado", "1");
  return `/entrar?${params}`;
}

function explain(error: AuthError): string {
  switch (error.code) {
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
      return "Ya te enviamos un código hace poco. Espera un minuto y vuelve a intentarlo.";
    case "email_address_invalid":
      return "Ese correo no parece válido. Revísalo, por favor.";
    case "email_address_not_authorized":
      return "Por ahora no podemos enviar correos a esa dirección. Prueba con otra.";
    case "otp_expired":
      return "El código venció o no es correcto. Pide uno nuevo.";
    default:
      console.error(`[supabase] auth: ${error.code ?? error.status} ${error.message}`);
      return "No pudimos conectar. Revisa tu conexión y vuelve a intentarlo.";
  }
}

/** Step 1: email → we send a 6-digit code. New emails get an account. */
export async function sendCode(_prev: AuthFormState, form: FormData): Promise<AuthFormState> {
  const email = String(form.get("correo") ?? "").trim().toLowerCase();
  const returnTo = safeReturnPath(form.get("volver"));
  if (!EMAIL.test(email) || email.length > 254) return { error: "Escribe tu correo, por ejemplo nombre@gmail.com." };

  if (!DEMO_MODE) {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
    if (error) return { error: explain(error) };
  }
  redirect(codeStep(email, returnTo, form.has("reenviar")));
}

/** Step 2: the code from the email opens the session. */
export async function verifyCode(_prev: AuthFormState, form: FormData): Promise<AuthFormState> {
  const email = String(form.get("correo") ?? "").trim().toLowerCase();
  const token = String(form.get("codigo") ?? "").replace(/\D/g, "");
  const returnTo = safeReturnPath(form.get("volver"));
  if (!EMAIL.test(email)) redirect(`/entrar?${new URLSearchParams({ volver: returnTo })}`);
  if (token.length < 6) return { error: "Escribe el código de 6 números que te llegó al correo." };
  if (DEMO_MODE) redirect(returnTo);

  const supabase = await createClient();
  const { data, error } = await supabase.auth.verifyOtp({ email, token, type: "email" });
  if (error || !data.user) {
    return { error: error?.code === "over_request_rate_limit" ? explain(error) : "El código no es correcto o ya venció. Revísalo o pide uno nuevo." };
  }

  const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", data.user.id).maybeSingle();
  if (!profile?.full_name?.trim()) redirect(`/entrar/nombre?${new URLSearchParams({ volver: returnTo })}`);
  redirect(returnTo);
}

/** First visit: how the person wants to appear ("Carlos M." on their listings). */
export async function saveName(_prev: AuthFormState, form: FormData): Promise<AuthFormState> {
  const name = String(form.get("nombre") ?? "").trim().replace(/\s+/g, " ");
  const returnTo = safeReturnPath(form.get("volver"));
  if (name.length < 2) return { error: "Escribe tu nombre." };
  if (name.length > 80) return { error: "El nombre es demasiado largo." };
  if (DEMO_MODE) redirect(returnTo);

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const userId = auth?.claims?.sub;
  if (!userId) redirect(`/entrar?${new URLSearchParams({ volver: returnTo })}`);
  const { error } = await supabase.from("profiles").update({ full_name: name }).eq("id", userId);
  if (error) {
    console.error(`[supabase] save name: ${error.message}`);
    return { error: "No pudimos guardar tu nombre. Vuelve a intentarlo." };
  }
  redirect(returnTo);
}

export async function signOut() {
  if (!DEMO_MODE) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect("/perfil");
}
