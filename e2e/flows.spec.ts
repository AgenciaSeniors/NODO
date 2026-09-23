import { expect, test, type Page } from "@playwright/test";

async function chooseLocation(page: Page, province: string, municipality: string, returnTo = "/") {
  await page.goto(`/ubicacion?volver=${encodeURIComponent(returnTo)}`);
  await page.getByLabel("Provincia").selectOption(province);
  await page.getByLabel("Municipio").selectOption(municipality);
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.waitForURL(returnTo);
}

test("first visit asks for a location and filters by province", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Elige tu provincia y municipio")).toBeVisible();

  await page.goto("/ubicacion?volver=/tiendas");
  await page.getByLabel("Provincia").selectOption("holguin");
  // 14 municipalities plus "Todos los municipios".
  await expect(page.getByLabel("Municipio").locator("option")).toHaveCount(15);
  await page.getByLabel("Municipio").selectOption("moa");
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.waitForURL("/tiendas");
  await expect(page.getByText("Moa, Holguín")).toBeVisible();
  await expect(page.getByText("Todavía no hay publicaciones en Holguín")).toBeVisible();

  await chooseLocation(page, "la-habana", "plaza-de-la-revolucion");
  await expect(page.getByRole("heading", { name: "Destacados cerca de ti" })).toBeVisible();
});

test("the return path after choosing a location stays on the site", async ({ page, baseURL }) => {
  await page.goto("/ubicacion?volver=//evil.example");
  await page.getByLabel("Provincia").selectOption("la-habana");
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.waitForLoadState("load");
  expect(new URL(page.url()).origin).toBe(baseURL);
});

test("explore filters, sort and accent-insensitive search", async ({ page }) => {
  await chooseLocation(page, "la-habana", "plaza-de-la-revolucion");
  await page.goto("/explorar");
  const cards = page.locator('main a[href^="/producto/"]');
  const all = await cards.count();
  await page.getByRole("link", { name: "Por cantidad", exact: true }).click();
  await page.waitForURL(/filtro=cantidad/);
  await expect.poll(() => cards.count()).toBeLessThan(all);

  await page.getByLabel("Ordenar por").selectOption("precio-asc");
  await page.waitForURL(/orden=precio-asc/);
  expect(page.url()).toContain("filtro=cantidad");

  await page.goto("/explorar?q=cafe");
  await expect(page.getByRole("heading", { name: "Café molido 250 g" })).toBeVisible();
});

test("create a store, then publish its first product with quantity pricing", async ({ page }) => {
  await chooseLocation(page, "la-habana", "plaza-de-la-revolucion");
  await page.goto("/perfil/tiendas/nueva");
  await page.getByRole("button", { name: "Crear tienda" }).click();
  await expect(page.getByText("Escribe el nombre de la tienda.")).toBeVisible();
  await expect(page.getByText("Escribe un móvil cubano")).toBeVisible();
  await expect(page.getByLabel("Nombre de la tienda")).toBeFocused();

  await page.getByLabel("Nombre de la tienda").fill("Dulcería Mi Barrio");
  await expect(page.getByText("Escribe el nombre de la tienda.")).toBeHidden();
  await page.getByLabel("Categoría").selectOption("alimentos");
  await page.getByLabel("WhatsApp / Teléfono").fill("52456789");
  await page.getByText("Domicilio", { exact: true }).click();
  await page.getByRole("button", { name: "Crear tienda" }).click();

  await page.waitForURL(/perfil\/tiendas\/creada/);
  await expect(page.getByRole("heading", { name: "Dulcería Mi Barrio" })).toBeVisible();
  await expect(page.getByText("+53 5 245 6789")).toBeVisible();
  await page.getByRole("link", { name: /Agregar mi primer producto/ }).click();
  await page.waitForURL(/publicar/);

  await page.getByRole("button", { name: "Continuar" }).click();
  await expect(page.getByLabel("Nombre del producto")).toBeFocused();
  await page.getByLabel("Nombre del producto").fill("Aceite 1 L");
  await page.getByLabel("Categoría").selectOption("alimentos");
  await expect(page.getByText("Estado", { exact: true })).toBeHidden();
  await page.getByLabel("Precio", { exact: true }).fill("650");
  await page.getByText("Unidad + por cantidad").click();
  await page.getByLabel("Rango 1: cantidad mínima").fill("6");
  await page.getByLabel(/Rango 1: precio/).fill("620");
  await page.getByLabel("Rango 2: cantidad mínima").fill("12");
  await page.getByLabel(/Rango 2: precio/).fill("590");
  await page.getByRole("button", { name: "Continuar" }).click();

  await expect(page.getByText("¿Quién lo vende?")).toBeVisible();
  await expect(page.getByLabel("Dulcería Mi Barrio")).toBeChecked();
  await page.getByLabel("WhatsApp de contacto").fill("+53 5 245 6789");
  await page.getByRole("button", { name: "Continuar" }).click();

  await expect(page.getByText("1–5 unidades")).toBeVisible();
  await expect(page.getByText("12+ unidades")).toBeVisible();
  await page.getByRole("button", { name: "Publicar" }).click();
  await expect(page.getByText("¡Todo listo para publicar!")).toBeVisible();
});

test("categories: Más opens the list and filters Explorar", async ({ page }) => {
  await chooseLocation(page, "la-habana", "plaza-de-la-revolucion");
  await page.getByRole("link", { name: "Más", exact: true }).click();
  await page.waitForURL("/categorias");
  await page.getByRole("link", { name: "Hogar" }).click();
  await page.waitForURL(/categoria=hogar/);
  await expect(page.getByRole("link", { name: "Hogar" })).toHaveAttribute("aria-current", "true");
  await expect(page.getByRole("heading", { name: "Olla de presión 6 L" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Aceite vegetal 1 L" })).toBeHidden();
});

test("favorites: hearts stay in sync and show up in Perfil", async ({ page }) => {
  await page.goto("/producto/p1");
  const hearts = page.getByRole("button", { name: "Guardar Aceite vegetal 1 L en favoritos" });
  await expect(hearts).toHaveCount(2); // header and bottom bar
  await hearts.first().click();
  await expect(hearts.nth(0)).toHaveAttribute("aria-pressed", "true");
  await expect(hearts.nth(1)).toHaveAttribute("aria-pressed", "true");

  await page.goto("/perfil/favoritos");
  await expect(page.getByRole("heading", { name: "Aceite vegetal 1 L" })).toBeVisible();
  await page.getByRole("button", { name: "Guardar Aceite vegetal 1 L en favoritos" }).click();
  await expect(page.getByText("Aún no guardas productos")).toBeVisible();
});

test("product page: prefilled WhatsApp message and share preview", async ({ page }) => {
  await page.goto("/producto/p1");
  const href = await page.getByRole("link", { name: "Contactar por WhatsApp" }).getAttribute("href");
  expect(decodeURIComponent(href!)).toContain("vi tu publicación de Aceite vegetal 1 L en NODO. ¿Sigue disponible?");
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute("content", "Aceite vegetal 1 L · 650 CUP");
});

test("no page scrolls sideways on a phone", async ({ page }) => {
  await chooseLocation(page, "la-habana", "plaza-de-la-revolucion");
  for (const path of ["/", "/tiendas", "/explorar", "/categorias", "/producto/p6", "/perfil", "/perfil/favoritos", "/publicar", "/perfil/tiendas/nueva"]) {
    await page.goto(path);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, path).toBeLessThanOrEqual(0);
  }
});

test("installable: manifest and service worker", async ({ page, request }) => {
  const manifest = await (await request.get("/manifest.webmanifest")).json();
  expect(manifest).toMatchObject({ short_name: "NODO", display: "standalone", start_url: "/" });
  const sw = await request.get("/sw.js");
  expect(sw.headers()["cache-control"]).toContain("no-cache");
  await page.goto("/");
  await expect.poll(() => page.evaluate(async () => Boolean(await navigator.serviceWorker.getRegistration()))).toBe(true);
});
