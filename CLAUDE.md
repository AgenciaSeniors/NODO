@AGENTS.md

# NODO

Marketplace local para Cuba: encontrar productos y tiendas cerca, y cerrar la compra por WhatsApp.
PWA hecha con Next.js 16 (App Router) + TypeScript + Tailwind 4; base de datos en Supabase.

## Comandos

- `npm run dev` · `npm run build` · `npm run start`
- `npm run lint` · `npm run typecheck` · `npm test` (Vitest, `src/**/*.test.ts`)
- `npm run test:e2e` (Playwright contra un build de producción: ejecuta `npm run build` antes)
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
- El navegador no debe hablar directamente con Supabase: las consultas van por el servidor de Next.js.
- Moneda siempre explícita (CUP, USD, EUR, MLC); comparar precios solo vía `toCupEstimate`.

## Código

- Las páginas obtienen datos solo de `src/lib/data.ts` (hoy datos de ejemplo en `src/lib/demo/`; mañana Supabase).
  Los tipos de `src/lib/types.ts` reflejan el esquema de `supabase/migrations`.
- Provincias/municipios y categorías existen en TS (`src/lib/geo/cuba.ts`, `src/lib/catalog.ts`) y en la
  migración de datos de referencia; `src/lib/reference-data.test.ts` exige que coincidan.
- Textos de la interfaz en español. Colores de marca en `src/app/globals.css`: el verde 500 es el del logo;
  texto y botones con texto blanco usan 600/700 por contraste.
- Objetivos táctiles de 44 px como mínimo; formularios con `<label>` reales y errores enlazados al campo.
