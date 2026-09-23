"use server";

import { redirect } from "next/navigation";
import type { AuthError } from "@supabase/supabase-js";
import { isEmail, parseSignIn, parseSignUp, readEmail, type AccountErrors } from "@/lib/account-input";
import { safeReturnPath } from "@/lib/location";
import { DEMO_MODE } from "@/lib/mode";
import { createClient } from "@/lib/supabase/server";

/**
 * `email` and `name` travel back so the form keeps what was typed: React
 * clears a form's fields after its action runs.
 */
export type AuthFormState = { error?: string; errors?: AccountErrors; email?: string; name?: string };

const hasErrors = (errors: AccountErrors) => Object.keys(errors).length > 0;

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
    case "invalid_credentials":
      return "El correo o la contraseña no son correctos.";
    case "user_already_exists":
    case "email_exists":
      return "Ya hay una cuenta con ese correo. Entra con tu contraseña.";
    case "weak_password":
      return "Esa contraseña es muy fácil de adivinar. Prueba con otra más larga.";
    case "signup_disabled":
    case "email_not_confirmed":
      console.error(`[supabase] auth: ${error.code}. Is "Confirm email" still on?`);
      return "Todavía no podemos abrir cuentas nuevas. Inténtalo más tarde.";
    default:
      console.error(`[supabase] auth: ${error.code ?? error.status} ${error.message}`);
      return "No pudimos conectar. Revisa tu conexión y vuelve a intentarlo.";
  }
}

/** Step 1: email → we send a 6-digit code. New emails get an account. */
export async function sendCode(_prev: AuthFormState, form: FormData): Promise<AuthFormState> {
  const email = readEmail(form);
  const returnTo = safeReturnPath(form.get("volver"));
  if (!isEmail(email)) return { error: "Escribe tu correo, por ejemplo nombre@gmail.com.", email };

  if (!DEMO_MODE) {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
    if (error) return { error: explain(error), email };
  }
  redirect(codeStep(email, returnTo, form.has("reenviar")));
}

/** Step 2: the code from the email opens the session. */
export async function verifyCode(_prev: AuthFormState, form: FormData): Promise<AuthFormState> {
  const email = readEmail(form);
  const token = String(form.get("codigo") ?? "").replace(/\D/g, "");
  const returnTo = safeReturnPath(form.get("volver"));
  if (!isEmail(email)) redirect(`/entrar?${new URLSearchParams({ volver: returnTo })}`);
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

/** Email + password, for returning people. */
export async function signInWithPassword(_prev: AuthFormState, form: FormData): Promise<AuthFormState> {
  const { email, password, errors } = parseSignIn(form);
  const returnTo = safeReturnPath(form.get("volver"));
  if (hasErrors(errors)) return { errors, email };
  if (DEMO_MODE) redirect(returnTo);

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) return { error: error ? explain(error) : "No pudimos entrar. Vuelve a intentarlo.", email };

  const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", data.user.id).maybeSingle();
  if (!profile?.full_name?.trim()) redirect(`/entrar/nombre?${new URLSearchParams({ volver: returnTo })}`);
  redirect(returnTo);
}

/**
 * New account with name, email and password. With "Confirm email" turned off
 * in Supabase the session opens right away and no email is sent.
 */
export async function signUpWithPassword(_prev: AuthFormState, form: FormData): Promise<AuthFormState> {
  const { name, email, password, errors } = parseSignUp(form);
  const returnTo = safeReturnPath(form.get("volver"));
  if (hasErrors(errors)) return { errors, email, name };
  if (DEMO_MODE) redirect(returnTo);

  const supabase = await createClient();
  // The name goes in the account metadata; a database trigger copies it to the profile.
  const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: name } } });
  if (error) return { error: explain(error), email, name };
  if (!data.session) {
    // Supabase still asks for email confirmation, which NODO can't send yet.
    console.error('[supabase] sign-up without session: turn off "Confirm email" in Authentication → Sign In / Providers → Email');
    return { error: "Todavía no podemos abrir cuentas nuevas. Inténtalo más tarde.", email, name };
  }
  redirect(returnTo);
}

/** First visit: how the person wants to appear ("Carlos M." on their listings). */
export async function saveName(_prev: AuthFormState, form: FormData): Promise<AuthFormState> {
  const name = String(form.get("nombre") ?? "").trim().replace(/\s+/g, " ");
  const returnTo = safeReturnPath(form.get("volver"));
  if (name.length < 2) return { error: "Escribe tu nombre.", name };
  if (name.length > 80) return { error: "El nombre es demasiado largo.", name };
  if (DEMO_MODE) redirect(returnTo);

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const userId = auth?.claims?.sub;
  if (!userId) redirect(`/entrar?${new URLSearchParams({ volver: returnTo })}`);
  const { error } = await supabase.from("profiles").update({ full_name: name }).eq("id", userId);
  if (error) {
    console.error(`[supabase] save name: ${error.message}`);
    return { error: "No pudimos guardar tu nombre. Vuelve a intentarlo.", name };
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
