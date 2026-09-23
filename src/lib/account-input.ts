// What the "Entrar" and "Crear cuenta" forms send, checked on the server.

export type AccountErrors = Partial<Record<"name" | "email" | "password", string>>;

export const MIN_PASSWORD = 8;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function readEmail(form: FormData): string {
  return String(form.get("correo") ?? "").trim().toLowerCase();
}

export function isEmail(email: string): boolean {
  return EMAIL.test(email) && email.length <= 254;
}

export function parseSignIn(form: FormData) {
  const email = readEmail(form);
  const password = String(form.get("contrasena") ?? "");
  const errors: AccountErrors = {};
  if (!isEmail(email)) errors.email = "Escribe tu correo, por ejemplo nombre@gmail.com.";
  if (!password) errors.password = "Escribe tu contraseña.";
  return { email, password, errors };
}

export function parseSignUp(form: FormData) {
  const name = String(form.get("nombre") ?? "").trim().replace(/\s+/g, " ");
  const email = readEmail(form);
  const password = String(form.get("contrasena") ?? "");
  const errors: AccountErrors = {};
  if (name.length < 2) errors.name = "Escribe tu nombre.";
  else if (name.length > 80) errors.name = "El nombre es demasiado largo.";
  if (!isEmail(email)) errors.email = "Escribe tu correo, por ejemplo nombre@gmail.com.";
  if (password.length < MIN_PASSWORD) errors.password = `Usa al menos ${MIN_PASSWORD} caracteres.`;
  else if (password.length > 72) errors.password = "La contraseña es demasiado larga (máximo 72).";
  else if (password.trim().toLowerCase() === email) errors.password = "No uses tu correo como contraseña.";
  return { name, email, password, errors };
}
