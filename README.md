# NODO

**Todo conecta cerca de ti.** Marketplace local para Cuba: encuentra productos y tiendas de tu
municipio, compara precio, pago y entrega, y escribe al vendedor por WhatsApp.

> Estado: primera versión navegable con **datos de ejemplo**. La base de datos (Supabase) tiene el
> esquema y las reglas de seguridad listos, pero la app todavía no está conectada.

## Por qué una PWA

- Google Play y el App Store no están disponibles en Cuba: la app se instala desde el navegador.
- Cada tienda y producto tiene un enlace que abre sin instalar nada y muestra vista previa en WhatsApp.
- Pesa poco: la primera visita a Inicio son ~190 KB y después el service worker guarda lo visitado,
  así que las páginas vistas se abren sin conexión.
- La fuente se sirve desde nuestro propio dominio (no depende de Google Fonts).

## Empezar

```bash
npm install
npm run dev        # http://localhost:3000
```

| Comando | Qué hace |
| --- | --- |
| `npm run lint` / `npm run typecheck` | ESLint y TypeScript |
| `npm test` | Pruebas unitarias (Vitest) |
| `npm run build && npm run test:e2e` | Pruebas en navegador (Playwright) contra el build de producción |
| `DATABASE_URL=… npm run test:db` | Aplica las migraciones a un PostgreSQL vacío y prueba las reglas de seguridad |

## Pantallas

Inicio · Explorar (filtros Tiendas, Ofertas, Por cantidad, Domicilio y orden) · Ficha de producto
(precio por cantidad, disponibilidad, WhatsApp con mensaje preparado) · Tiendas y perfil de tienda ·
Perfil · Crear tienda y confirmación · Publicar producto en 3 pasos · Selector de provincia y municipio
(las 16 divisiones y 168 municipios).

## Base de datos (Supabase)

`supabase/migrations/` contiene:

1. `…_initial_schema.sql`: perfiles, tiendas y sus miembros, productos con precio por cantidad,
   imágenes, favoritos, seguidores y reportes. Seguridad por filas (RLS) en todas las tablas,
   límite de publicaciones por plan (Gratis 10 · Pro 50 · Negocio 200) y búsqueda sin acentos.
2. `…_reference_data.sql`: provincias, municipios y categorías.

Para aplicarlas a un proyecto: `supabase link --project-ref <ref>` y `supabase db push`
(o pegarlas en orden en el editor SQL del panel).

## Estructura

```
src/app/            rutas (App Router); (app)/ lleva la barra de navegación inferior
src/components/     marca, layout, tarjetas, formularios
src/lib/            datos (data.ts), tipos, geografía de Cuba, formato, WhatsApp
supabase/           migraciones y pruebas de la base de datos
e2e/                pruebas en navegador
```
