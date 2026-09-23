@AGENTS.md

# NODO

Marketplace local para Cuba: encontrar productos y tiendas cerca, y cerrar la compra por WhatsApp.
PWA hecha con Next.js 16 (App Router) + TypeScript + Tailwind 4; base de datos en Supabase.

## Comandos

- `npm run dev` · `npm run build` · `npm run start`
- `npm run lint` · `npm run typecheck` · `npm test` (Vitest, `src/**/*.test.ts`)
- `npm run test:e2e` (Playwright contra un build de producción en modo ejemplo: ejecuta `NODO_MODE=demo npm run build` antes)
- `npm run test:db` (aplica `supabase/migrations` sobre un PostgreSQL vacío y prueba RLS; requiere `DATABASE_URL` desechable)

## Reglas de producto que el código respeta

- Una cuenta es siempre una persona. Las tiendas son entidades aparte unidas por `store_members`
  (una persona puede tener varias tiendas; una tienda, varios administradores). Nada de "cuentas de tienda".
- 1 publicación = 1 producto. "Mayorista" es una modalidad del producto (`sale_mode` + `quantity_tiers`), no un tipo de cuenta.
- Catálogo de tienda ≠ feed: cargar 150 productos no inunda Inicio.
- El cierre es por WhatsApp (`src/lib/whatsapp.ts`), sin checkout ni créditos internos.
- La disponibilidad siempre muestra su frescura ("confirmado hace…").
- Todo contenido pagado se etiqueta "Destacado".

## Restricciones de Cuba

- Datos móviles caros y conexiones lentas: cuidar el peso de cada página, no añadir dependencias pesadas en el cliente.
- Nada en tiempo de ejecución puede depender de servicios que bloquean Cuba (Google Fonts, Firebase, etc.).
  Las fuentes se sirven desde nuestro dominio con `next/font`.
- El navegador no debe hablar directamente con Supabase: las consultas, el inicio de sesión y la subida de
  fotos van por el servidor de Next.js (acciones de servidor), y las fotos se sirven desde `/fotos/...`.
  No uses `createBrowserClient` ni URLs de `supabase.co` en el cliente.
- Nada de SMS a +53 (Twilio y similares no entregan a Cuba). Hoy se entra con correo + contraseña
  (`LOGIN_METHOD` en `src/lib/mode.ts`); el código por correo (`NODO_LOGIN=code`) espera a tener SMTP propio.
- Moneda siempre explícita (CUP, USD, EUR, MLC); comparar precios solo vía `toCupEstimate`.

## Código

- Las páginas obtienen datos solo de `src/lib/data.ts`: filas reales de Supabase (`src/lib/supabase/queries.ts`,
  convertidas en `rows.ts`) seguidas del contenido de ejemplo de `src/lib/demo/` (con `example: true`,
  etiqueta «Ejemplo» y sin WhatsApp). Filtros y orden comunes en `src/lib/refine.ts`.
  Los tipos de `src/lib/types.ts` reflejan el esquema de `supabase/migrations`.
- Modos (`src/lib/mode.ts`): `NODO_MODE=demo` usa solo ejemplos y nunca toca la base de datos (CI, e2e,
  Vitest); `NODO_EXAMPLE_CONTENT=off` quita los ejemplos. Se leen en el servidor, nunca en componentes cliente.
- Quién ha entrado: `getViewer()` / `requireViewer()` de `src/lib/auth.ts`. Las escrituras son acciones de
  servidor que validan con `src/lib/listing-input.ts` (la misma validación que usa el formulario) y
  dependen de RLS: nunca uses la clave `service_role` en la app.
- Las fotos se reducen en el teléfono (`src/lib/resize-image.ts`) y el servidor comprueba sus bytes
  (`src/lib/image-type.ts`) antes de subirlas a la carpeta `<id de usuario>/` del bucket.
- Provincias/municipios y categorías existen en TS (`src/lib/geo/cuba.ts`, `src/lib/catalog.ts`) y en la
  migración de datos de referencia; `src/lib/reference-data.test.ts` exige que coincidan.
- Textos de la interfaz en español. Colores de marca en `src/app/globals.css`: el verde 500 es el del logo;
  texto y botones con texto blanco usan 600/700 por contraste.
- Objetivos táctiles de 44 px como mínimo; formularios con `<label>` reales y errores enlazados al campo.
