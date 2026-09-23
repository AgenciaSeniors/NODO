import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { MailCheck } from "lucide-react";
import { getViewer } from "@/lib/auth";
import { safeReturnPath } from "@/lib/location";
import { DEMO_MODE } from "@/lib/mode";
import { AuthScreen } from "./auth-screen";
import { CodeForm, EmailForm, ResendForm } from "./forms";

export const metadata: Metadata = { title: "Entrar" };

export default async function SignInPage({ searchParams }: PageProps<"/entrar">) {
  const { correo, volver, reenviado } = await searchParams;
  const returnTo = safeReturnPath(typeof volver === "string" ? volver : "/perfil");
  const email = typeof correo === "string" ? correo : undefined;
  if (!DEMO_MODE && (await getViewer())) redirect(returnTo);

  if (!email) {
    // Going back to a page that needs an account would land here again.
    const needsAccount = returnTo.startsWith("/publicar") || returnTo.startsWith("/perfil/tiendas");
    return (
      <AuthScreen
        backHref={needsAccount ? "/" : returnTo}
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
