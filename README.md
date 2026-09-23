# NODO

**Todo conecta cerca de ti.** Marketplace local para Cuba: encuentra productos y tiendas de tu
municipio, compara precio, pago y entrega, y escribe al vendedor por WhatsApp.

> Estado: conectada a Supabase. Se crea la cuenta con correo y contraseña, se crean tiendas y se
> publican productos con fotos. Mientras NODO se llena, se muestran también productos y tiendas
> de **ejemplo**, marcados «Ejemplo» y sin contacto real.

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
| `NODO_MODE=demo npm run build && npm run test:e2e` | Pruebas en navegador (Playwright) contra el build de producción, solo con datos de ejemplo |
| `DATABASE_URL=… npm run test:db` | Aplica las migraciones a un PostgreSQL vacío y prueba las reglas de seguridad |

## Pantallas

Inicio · Explorar (categoría, filtros Tiendas, Ofertas, Por cantidad, Domicilio y orden) · Ficha de
producto (galería, precio por cantidad, disponibilidad, compartir, WhatsApp con mensaje preparado) ·
Tiendas y perfil de tienda · Perfil y Favoritos · Crear tienda y confirmación · Publicar producto en
3 pasos · Selector de provincia y municipio (las 16 divisiones y 168 municipios).

Entrar (`/entrar`): por ahora con correo y contraseña, sin enviar ningún correo (en Supabase,
«Confirm email» debe estar desactivado). Cuando NODO tenga su propio envío de correo (SMTP),
`NODO_LOGIN=code` cambia a entrar con un código de 6 números por correo, ya implementado. Nada de
SMS: no llegan a +53 desde los proveedores habituales. Publicar y Crear tienda piden cuenta; mirar
y guardar favoritos, no. Los favoritos se guardan en una cookie del propio teléfono.

### Modos

| Variable | Efecto |
| --- | --- |
| (ninguna) | Datos reales de Supabase + contenido de ejemplo marcado «Ejemplo» |
| `NODO_EXAMPLE_CONTENT=off` | Solo datos reales (para cuando NODO tenga contenido propio) |
| `NODO_MODE=demo` | Solo datos de ejemplo, sin tocar la base de datos (lo usan CI y las pruebas) |
| `NODO_LOGIN=code` | Entrar con código por correo en vez de contraseña (requiere SMTP propio) |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Apuntar a otro proyecto de Supabase |

El navegador nunca habla con Supabase: las consultas y la sesión pasan por el servidor de Next.js, y
las fotos se sirven desde nuestro dominio (`/fotos/...`). Las fotos se reducen en el teléfono antes
de enviarlas (1280 px y una miniatura de 420 px, en WebP).

## Base de datos (Supabase)

`supabase/migrations/` contiene:

1. `…_initial_schema.sql`: perfiles, tiendas y sus miembros, productos con precio por cantidad,
   imágenes, favoritos, seguidores y reportes. Seguridad por filas (RLS) en todas las tablas,
   límite de publicaciones por plan (Gratis 10 · Pro 50 · Negocio 200) y búsqueda sin acentos.
2. `…_reference_data.sql`: provincias, municipios y categorías.
3. `…_explicit_api_grants.sql`: permisos explícitos para la API (proyectos que no los dan por defecto).
4. `…_photo_storage.sql`: buckets públicos de fotos; cada persona solo sube a su propia carpeta.

En el panel de Supabase: Authentication → Sign In / Providers → Email → **Confirm email** desactivado
mientras se entra con contraseña. Para pasar al código por correo hace falta un SMTP propio (el
correo integrado de Supabase solo envía a los miembros del equipo y no deja editar plantillas); luego
las plantillas **Magic Link** y **Confirm signup** deben incluir `{{ .Token }}`.

Para aplicarlas a un proyecto: `supabase link --project-ref <ref>` y `supabase db push`
(o pegarlas en orden en el editor SQL del panel).

## Estructura

```
src/app/            rutas (App Router); (app)/ lleva la barra de navegación inferior
src/components/     marca, layout, tarjetas, formularios
src/lib/            datos (data.ts), sesión (auth.ts), validación de formularios, tipos, geografía de Cuba
src/lib/supabase/   cliente de servidor, consultas, filas → tipos, subida de fotos
supabase/           migraciones y pruebas de la base de datos
e2e/                pruebas en navegador
```
