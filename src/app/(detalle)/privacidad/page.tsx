import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AppHeader } from "@/components/layout/app-header";

export const metadata: Metadata = { title: "Política de privacidad" };

function one(value: string | string[] | undefined) {
  return typeof value === "string" ? value : "";
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-lg font-bold">{title}</h2>
      <div className="space-y-2 text-sm text-muted">{children}</div>
    </section>
  );
}

export default async function PrivacyPage({ searchParams }: PageProps<"/privacidad">) {
  const { volver } = await searchParams;
  return (
    <>
      <AppHeader backHref={one(volver) || "/perfil"} action="none" />
      <div className="space-y-6 px-4 pb-8">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">Política de privacidad</h1>
          <p className="text-sm text-muted">Última actualización: 3 de octubre de 2026.</p>
        </div>

        <p className="text-sm text-muted">
          Esta página explica, en lenguaje claro, qué datos guarda NODO, para qué los usa y qué puedes hacer con
          ellos.
        </p>

        <Section title="Qué guardamos">
          <ul className="list-disc space-y-1 pl-5">
            <li>Tu nombre, correo y contraseña (la contraseña nunca se guarda en texto claro).</li>
            <li>El número de WhatsApp que escribes para que te contacten por tus publicaciones o tu tienda.</li>
            <li>La provincia y el municipio que elijas, para mostrarte lo cercano y para tus publicaciones.</li>
            <li>Las fotos que subes de tus productos o el logo de tu tienda.</li>
            <li>Lo que marcas como favorito, y los reportes que envías.</li>
          </ul>
        </Section>

        <Section title="Qué no guardamos">
          <p>
            NODO no procesa pagos ni guarda datos de tarjetas: los tratos se cierran por fuera, directamente por
            WhatsApp. Tampoco tiene acceso a tus conversaciones de WhatsApp: el botón de contacto solo abre tu propia
            aplicación con un mensaje ya escrito.
          </p>
        </Section>

        <Section title="Para qué lo usamos">
          <ul className="list-disc space-y-1 pl-5">
            <li>Mostrar tus publicaciones y tu tienda a quienes buscan cerca de ti.</li>
            <li>Que quien compra pueda contactarte por WhatsApp.</li>
            <li>Revisar los reportes y mantener NODO libre de estafas y contenido prohibido.</li>
            <li>Recordar tu provincia y municipio entre visitas, para no tener que elegirlos cada vez.</li>
          </ul>
        </Section>

        <Section title="Qué se ve públicamente">
          <p>
            Tu nombre (con la inicial del apellido), el número de contacto de tus publicaciones, y los datos y el
            catálogo de tus tiendas son públicos: así funciona un directorio. Tu correo y tu contraseña nunca se
            muestran. No vendemos tus datos a nadie ni los usamos para publicidad de terceros.
          </p>
        </Section>

        <Section title="Dónde vive la información">
          <p>
            NODO guarda los datos en Supabase, con reglas que hacen que cada persona solo pueda cambiar lo suyo
            (sus publicaciones, su perfil, las tiendas que administra). El teléfono guarda tu provincia y municipio
            elegidos en una pequeña memoria local, y algunas fotos quedan en caché para que la app cargue rápido
            incluso con mala conexión.
          </p>
        </Section>

        <Section title="Tus derechos">
          <p>
            Puedes editar tu nombre, tu ubicación y tus publicaciones cuando quieras desde tu Perfil. Si quieres
            borrar tu cuenta y los datos que te pertenecen, pídelo desde «Ayuda y soporte»: lo haremos manualmente
            mientras esta opción no esté disponible dentro de la app.
          </p>
        </Section>

        <Section title="Menores de edad">
          <p>NODO no está pensado para menores de edad. Para crear una cuenta y vender o comprar, debes ser adulto.</p>
        </Section>

        <Section title="Cambios">
          <p>Esta política puede cambiar a medida que NODO crece. Los cambios importantes se avisarán dentro de la app.</p>
        </Section>
      </div>
    </>
  );
}
