import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AppHeader } from "@/components/layout/app-header";

export const metadata: Metadata = { title: "Términos de uso" };

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

export default async function TermsPage({ searchParams }: PageProps<"/terminos">) {
  const { volver } = await searchParams;
  return (
    <>
      <AppHeader backHref={one(volver) || "/perfil"} action="none" />
      <div className="space-y-6 px-4 pb-8">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">Términos de uso</h1>
          <p className="text-sm text-muted">Última actualización: 3 de octubre de 2026.</p>
        </div>

        <p className="text-sm text-muted">
          NODO es un directorio para que personas y tiendas cubanas se encuentren cerca de donde viven. Al usar NODO
          aceptas estos términos. Si no estás de acuerdo, no uses la app.
        </p>

        <Section title="Qué es NODO (y qué no es)">
          <p>
            NODO ayuda a publicar lo que vendes y a encontrar lo que buscas, por provincia y municipio. El trato se
            cierra directamente por WhatsApp entre quien compra y quien vende.
          </p>
          <p>
            NODO <strong>no participa en la venta</strong>: no cobra, no entrega, no garantiza que un producto exista,
            esté como se describe o que el pago llegue a buen puerto. Esa parte depende por completo de las dos
            personas que hacen el trato. Antes de pagar o entregar algo, usa el sentido común: conoce a quién le
            compras, revisa el producto en persona si puedes y desconfía de quien pide pagar por adelantado sin
            garantías.
          </p>
        </Section>

        <Section title="Tu cuenta">
          <p>
            Crear una cuenta es gratis. Eres responsable de lo que publicas con ella: que la información sea cierta,
            que el producto exista y que el número de contacto sea real y tuyo (o de tu tienda).
          </p>
          <p>
            Una tienda puede tener varias personas administrándola. Quien crea la tienda es su propietario; puede
            agregar a otras personas como administradoras y ellas podrán editar los datos de la tienda y su catálogo.
          </p>
        </Section>

        <Section title="Planes">
          <p>
            El plan Gratis permite hasta 10 publicaciones activas como particular. Los planes Pro y Negocio amplían
            ese límite; cuando estén disponibles, se cobrarán por fuera de la app (no hay pagos ni tarjetas dentro de
            NODO) y tendrán una fecha de vencimiento. Las tiendas, por ahora, no tienen límite de catálogo.
          </p>
        </Section>

        <Section title="Qué no se puede publicar">
          <ul className="list-disc space-y-1 pl-5">
            <li>Nada ilegal, robado o falsificado.</li>
            <li>Productos o servicios prohibidos por la ley cubana.</li>
            <li>Información falsa sobre el producto, el precio o quién lo vende.</li>
            <li>Contenido que suplante a otra persona o tienda, o que sea ofensivo, violento o engañoso.</li>
          </ul>
          <p>
            Cualquiera puede reportar una publicación desde su página con el botón «Reportar publicación». Las
            publicaciones o cuentas que incumplan estas reglas pueden ser ocultadas, archivadas o eliminadas sin
            aviso previo.
          </p>
        </Section>

        <Section title="Contenido de ejemplo">
          <p>
            Mientras NODO se llena de publicaciones reales, algunas tarjetas marcadas «Ejemplo» muestran contenido de
            prueba: no son productos ni tiendas reales y no se puede contactar a nadie a través de ellas.
          </p>
        </Section>

        <Section title="Cambios">
          <p>
            NODO está en construcción y estos términos pueden cambiar a medida que se agregan funciones nuevas. Si el
            cambio es importante, se avisará dentro de la app.
          </p>
        </Section>

        <Section title="Contacto">
          <p>Para dudas, reclamos o reportar un problema, usa «Ayuda y soporte» desde tu Perfil.</p>
        </Section>
      </div>
    </>
  );
}
