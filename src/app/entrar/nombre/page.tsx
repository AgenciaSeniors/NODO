import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getViewer } from "@/lib/auth";
import { safeReturnPath } from "@/lib/location";
import { AuthScreen } from "../auth-screen";
import { NameForm } from "../forms";

export const metadata: Metadata = { title: "Tu nombre" };

export default async function NamePage({ searchParams }: PageProps<"/entrar/nombre">) {
  const { volver } = await searchParams;
  const returnTo = safeReturnPath(typeof volver === "string" ? volver : "/perfil");
  const viewer = await getViewer();
  if (!viewer) redirect(`/entrar?${new URLSearchParams({ volver: returnTo })}`);

  return (
    <AuthScreen
      backHref="/perfil"
      title="¿Cómo te llamas?"
      intro={<p>Así te verán quienes compren tus productos. En público solo mostramos tu nombre y la inicial del apellido.</p>}
    >
      <NameForm returnTo={returnTo} name={viewer.name} />
    </AuthScreen>
  );
}
