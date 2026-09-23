import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { MailCheck } from "lucide-react";
import { getViewer } from "@/lib/auth";
import { cn } from "@/lib/cn";
import { safeReturnPath } from "@/lib/location";
import { DEMO_MODE, LOGIN_METHOD } from "@/lib/mode";
import { AuthScreen } from "./auth-screen";
import { CodeForm, EmailForm, PasswordSignInForm, ResendForm, SignUpForm } from "./forms";

export const metadata: Metadata = { title: "Entrar" };

/** Going back to a page that needs an account would land here again. */
function backFrom(returnTo: string) {
  return returnTo.startsWith("/publicar") || returnTo.startsWith("/perfil/tiendas") ? "/" : returnTo;
}

function PasswordScreen({ returnTo, signUp }: { returnTo: string; signUp: boolean }) {
  const tab = (active: boolean) =>
    cn(
      "flex h-11 flex-1 items-center justify-center rounded-xl text-sm font-semibold",
      active ? "bg-white text-ink shadow-sm" : "text-muted",
    );
  const href = (mode?: string) => `/entrar?${new URLSearchParams({ volver: returnTo, ...(mode ? { modo: mode } : {}) })}`;
  return (
    <AuthScreen
      backHref={backFrom(returnTo)}
      title={signUp ? "Crea tu cuenta" : "Entra a NODO"}
      intro={<p>{signUp ? "Para publicar productos y crear tu tienda. Es gratis." : "Con el correo y la contraseña de tu cuenta."}</p>}
    >
      <div className="space-y-5">
        <nav aria-label="Entrar o crear cuenta" className="flex gap-1 rounded-2xl bg-sand p-1">
          <Link href={href()} replace aria-current={signUp ? undefined : "page"} className={tab(!signUp)}>
            Entrar
          </Link>
          <Link href={href("crear")} replace aria-current={signUp ? "page" : undefined} className={tab(signUp)}>
            Crear cuenta
          </Link>
        </nav>
        {signUp ? <SignUpForm returnTo={returnTo} /> : <PasswordSignInForm returnTo={returnTo} />}
        <p className="text-center text-sm text-muted">
          {signUp ? (
            <>
              ¿Ya tienes cuenta?{" "}
              <Link href={href()} replace className="font-semibold text-brand-700">
                Entra aquí
              </Link>
            </>
          ) : (
            <>
              ¿Primera vez en NODO?{" "}
              <Link href={href("crear")} replace className="font-semibold text-brand-700">
                Crea tu cuenta
              </Link>
              <span className="mt-3 block">
                <Link href="/pronto?que=recuperar-contrasena" className="underline underline-offset-2">
                  ¿Olvidaste tu contraseña?
                </Link>
              </span>
            </>
          )}
        </p>
      </div>
    </AuthScreen>
  );
}

export default async function SignInPage({ searchParams }: PageProps<"/entrar">) {
  const { correo, volver, reenviado, modo } = await searchParams;
  const returnTo = safeReturnPath(typeof volver === "string" ? volver : "/perfil");
  const email = typeof correo === "string" ? correo : undefined;
  if (!DEMO_MODE && (await getViewer())) redirect(returnTo);

  if (LOGIN_METHOD === "password") return <PasswordScreen returnTo={returnTo} signUp={modo === "crear"} />;

  if (!email) {
    return (
      <AuthScreen
        backHref={backFrom(returnTo)}
        title="Entra a NODO"
        intro={
          <p>
            Para publicar productos y crear tu tienda. Te enviamos un código a tu correo: sin contraseñas. Si es tu
            primera vez, creamos tu cuenta.
          </p>
        }
      >
        <EmailForm returnTo={returnTo} />
      </AuthScreen>
    );
  }

  const changeEmail = `/entrar?${new URLSearchParams({ volver: returnTo })}`;
  return (
    <AuthScreen
      backHref={changeEmail}
      title="Revisa tu correo"
      intro={
        <p>
          Enviamos un código de 6 números a <strong className="font-semibold [overflow-wrap:anywhere] text-ink">{email}</strong>.
        </p>
      }
    >
      {reenviado ? (
        <p role="status" className="flex items-center gap-2 rounded-xl bg-brand-50 px-4 py-3 text-sm text-brand-700">
          <MailCheck aria-hidden className="size-5 shrink-0" />
          Te enviamos un código nuevo. Usa el del último correo.
        </p>
      ) : null}
      <CodeForm email={email} returnTo={returnTo} />
      <div className="space-y-2 text-center text-sm text-muted">
        <p>¿No te llegó? Mira en Spam o Promociones, o espera un minuto.</p>
        <ResendForm email={email} returnTo={returnTo} />
        <Link href={changeEmail} className="inline-flex min-h-11 items-center font-semibold text-ink underline underline-offset-2">
          Usar otro correo
        </Link>
      </div>
    </AuthScreen>
  );
}
