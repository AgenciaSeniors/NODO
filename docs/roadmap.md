# NODO · hoja de ruta

Decisiones tomadas con el dueño del producto que aún no están construidas.

## Panel de administrador (después)

Para el equipo de NODO, no para las tiendas. Primera versión:

- **Planes**: crear y editar planes (nombre, precio, límite de publicaciones activas) y asignarlos.
  - Se aplican **a personas y a tiendas por separado**: cada persona tiene su plan para lo que
    vende como particular y cada tienda el suyo para su catálogo.
  - **Se cobran por fuera** (Transfermóvil, EnZona, Zelle, efectivo). El administrador activa el
    plan con **fecha de vencimiento por meses** (1, 3 o 12); al vencer vuelve a Gratis y el panel
    lo avisa. Nada de créditos internos ni checkout.
  - Hoy los límites están fijos en el código y en el trigger `enforce_listing_limit`
    (Gratis 10 · Pro 50 · Negocio 200) y las tiendas no tienen límite: el panel los pasará a una
    tabla de planes editable.
- **Métricas y estadísticas**: cuentas, tiendas y publicaciones nuevas, actividad por provincia.
- Más adelante: destacados, verificación y suspensión de tiendas, reportes, tasas de cambio.

Técnicamente: ruta `/admin` en la misma app, con administradores en una tabla propia y funciones
`security definer` que comprueban el rol; nunca la clave `service_role` en la app.

## Pendiente para abrir al público

- Administrar tienda (datos, logo, catálogo).
- SMTP propio → recuperar contraseña y, si se quiere, entrar con código (`NODO_LOGIN=code`).
- Tasas de cambio reales en lugar de las fijas de `toCupEstimate`.
- Términos, privacidad y reportar publicaciones.
- Probar desde Cuba con datos móviles.
