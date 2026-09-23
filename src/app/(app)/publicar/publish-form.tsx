"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { ArrowLeftRight, Banknote, Check, CirclePlus, House, MessageCircle, Trash2, Truck } from "lucide-react";
import { Field, inputClass, Select } from "@/components/forms/field";
import { LocationFields } from "@/components/forms/location-fields";
import { PhotoPicker, type PickedPhoto } from "@/components/forms/photo-picker";
import { TextareaCounter } from "@/components/forms/textarea-counter";
import { ToggleChip } from "@/components/forms/toggle-chip";
import { ProductImage } from "@/components/product/product-image";
import { CATEGORIES, CURRENCIES, DELIVERY_LABELS, PAYMENT_LABELS, findCategory } from "@/lib/catalog";
import { cn } from "@/lib/cn";
import { formatPrice } from "@/lib/format";
import { findMunicipality, findProvince } from "@/lib/geo/cuba";
import { normalizePhone } from "@/lib/phone";
import { tierRows } from "@/lib/tiers";
import type { Currency, DeliveryMethod, PaymentMethod, SaleMode } from "@/lib/types";

export type SellerOption = {
  key: string;
  label: string;
  payment?: PaymentMethod[];
  delivery?: DeliveryMethod[];
  provinceId: string;
  municipalityId: string;
  whatsapp?: string;
};

type TierDraft = { key: number; minQty: string; unitPrice: string };

type Draft = {
  photos: PickedPhoto[];
  title: string;
  category: string;
  condition: "new" | "used";
  description: string;
  price: string;
  currency: Currency;
  saleMode: SaleMode;
  minQty: string;
  tiers: TierDraft[];
  seller: string;
  payment: PaymentMethod[];
  delivery: DeliveryMethod[];
  province: string;
  municipality: string;
  whatsapp: string;
};

type Errors = Record<string, string>;

const STEPS = ["Producto", "Venta", "Revisar"];
// "Nuevo / Usado" only makes sense for goods that can be second-hand.
const NO_CONDITION = new Set(["alimentos", "salud"]);
const SALE_MODES: Array<{ id: SaleMode; label: string }> = [
  { id: "unit", label: "Solo por unidad" },
  { id: "unit_and_bulk", label: "Unidad + por cantidad" },
  { id: "bulk_only", label: "Solo por cantidad" },
];

let tierKey = 0;
const newTier = (minQty = "", unitPrice = ""): TierDraft => ({ key: ++tierKey, minQty, unitPrice });
const toggle = <T,>(list: T[], value: T, on: boolean) => (on ? [...list, value] : list.filter((v) => v !== value));
const positive = (value: string) => Number(value.replace(",", "."));

export function PublishForm({
  sellers,
  initialSeller,
  remainingListings,
  planName,
}: {
  sellers: SellerOption[];
  initialSeller: string;
  remainingListings: number;
  planName: string;
}) {
  const start = sellers.find((s) => s.key === initialSeller) ?? sellers[0];
  const [step, setStep] = useState(0);
  const [published, setPublished] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [draft, setDraft] = useState<Draft>(() => ({
    photos: [],
    title: "",
    category: "",
    condition: "new",
    description: "",
    price: "",
    currency: "CUP",
    saleMode: "unit",
    minQty: "",
    tiers: [newTier(), newTier()],
    seller: start.key,
    payment: start.payment ?? ["cash"],
    delivery: start.delivery ?? ["pickup"],
    province: start.provinceId,
    municipality: start.municipalityId,
    whatsapp: start.whatsapp ?? "",
  }));
  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => {
    setDraft((d) => ({ ...d, [key]: value }));
    // Editing a field clears its error (draft keys and error keys match).
    setErrors((e) => (key in e ? Object.fromEntries(Object.entries(e).filter(([k]) => k !== key)) : e));
  };

  function validateProduct(): Errors {
    const e: Errors = {};
    if (draft.title.trim().length < 3) e.title = "Escribe el nombre del producto.";
    if (!draft.category) e.category = "Elige una categoría.";
    if (!(positive(draft.price) > 0)) e.price = "Escribe un precio mayor que 0.";
    if (draft.saleMode === "bulk_only" && !(Number(draft.minQty) >= 2)) e.minQty = "Indica la cantidad mínima (2 o más).";
    if (draft.saleMode !== "unit") {
      const filled = draft.tiers.filter((t) => t.minQty || t.unitPrice);
      if (draft.saleMode === "unit_and_bulk" && filled.length === 0) e.tiers = "Agrega al menos un precio por cantidad.";
      const seen = new Set<number>();
      for (const t of filled) {
        const qty = Number(t.minQty);
        if (!Number.isInteger(qty) || qty < 2) e.tiers = "Cada rango empieza en 2 unidades o más.";
        else if (!(positive(t.unitPrice) > 0)) e.tiers = "Cada rango necesita un precio.";
        else if (seen.has(qty)) e.tiers = "Hay dos rangos con la misma cantidad.";
        seen.add(qty);
      }
    }
    return e;
  }

  function next(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    let e: Errors = {};
    if (step === 0) e = validateProduct();
    if (step === 1) {
      const data = new FormData(event.currentTarget);
      const province = String(data.get("provincia") ?? "");
      const municipality = String(data.get("municipio") ?? "");
      const whatsapp = normalizePhone(String(data.get("whatsapp") ?? ""));
      setDraft((d) => ({ ...d, province, municipality, whatsapp: whatsapp ?? String(data.get("whatsapp") ?? "") }));
      if (draft.payment.length === 0) e.payment = "Marca al menos una forma de pago.";
      if (draft.delivery.length === 0) e.delivery = "Marca al menos una forma de entrega.";
      if (!province) e.province = "Elige la provincia.";
      if (!municipality) e.municipality = "Elige el municipio.";
      if (!whatsapp) e.whatsapp = "Escribe un móvil cubano de 8 dígitos (empieza por 5 o 6).";
    }
    setErrors(e);
    if (Object.keys(e).length > 0) {
      requestAnimationFrame(() => document.querySelector<HTMLElement>("[aria-invalid='true']")?.focus());
      return;
    }
    if (step === 2) {
      // Saving arrives with the database; for now the flow ends here.
      setPublished(true);
    } else {
      setStep(step + 1);
    }
    window.scrollTo({ top: 0 });
  }

  function chooseSeller(key: string) {
    const s = sellers.find((x) => x.key === key);
    if (!s) return;
    setDraft((d) => ({
      ...d,
      seller: key,
      payment: s.payment ?? d.payment,
      delivery: s.delivery ?? d.delivery,
      province: s.provinceId || d.province,
      municipality: s.municipalityId || d.municipality,
      whatsapp: s.whatsapp ?? d.whatsapp,
    }));
  }

  if (published) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl bg-white p-6 text-center ring-1 ring-line/60">
        <span className="flex size-16 items-center justify-center rounded-full bg-brand-100">
          <Check aria-hidden className="size-8 text-brand-600" strokeWidth={3} />
        </span>
        <h2 className="text-xl font-bold">¡Todo listo para publicar!</h2>
        <p className="text-sm text-muted">
          En esta versión de prueba la publicación aún no se guarda. Cuando conectemos la base de datos
          aparecerá en Inicio y en Explorar.
        </p>
        <Link href="/" className="flex h-12 items-center rounded-2xl bg-brand-600 px-6 font-semibold text-white">
          Volver al inicio
        </Link>
      </div>
    );
  }

  const seller = sellers.find((s) => s.key === draft.seller) ?? sellers[0];
  const showCondition = draft.category !== "" && !NO_CONDITION.has(draft.category);

  return (
    <form onSubmit={next} noValidate className="space-y-5">
      <Stepper step={step} />

      {step === 0 ? (
        <>
          <Card>
            <div className="mb-3 flex items-baseline justify-between">
              <h2 className="font-bold">Agregar fotos</h2>
              <span className="text-sm text-muted">Hasta 6 fotos</span>
            </div>
            <PhotoPicker id="producto-fotos" max={6} photos={draft.photos} onChange={(p) => set("photos", p)} />
          </Card>

          <Card className="space-y-4">
            <Field label="Nombre del producto" htmlFor="producto-nombre" error={errors.title}>
              <input
                id="producto-nombre"
                value={draft.title}
                maxLength={80}
                onChange={(e) => set("title", e.target.value)}
                placeholder="Ej. Aceite 1 L"
                aria-invalid={errors.title ? true : undefined}
                className={inputClass}
              />
            </Field>
            <div className={cn("grid gap-3", showCondition && "grid-cols-2")}>
              <Field label="Categoría" htmlFor="producto-categoria" error={errors.category}>
                <Select
                  id="producto-categoria"
                  value={draft.category}
                  onChange={(e) => set("category", e.target.value)}
                  aria-invalid={errors.category ? true : undefined}
                >
                  <option value="" disabled>
                    Elige…
                  </option>
                  {CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </Select>
              </Field>
              {showCondition ? (
                <fieldset className="space-y-1.5">
                  <legend className="mb-1.5 text-sm font-semibold">Estado</legend>
                  <div className="grid grid-cols-2 gap-2">
                    <ToggleChip type="radio" name="estado" value="new" label="Nuevo" checked={draft.condition === "new"} onChange={() => set("condition", "new")} />
                    <ToggleChip type="radio" name="estado" value="used" label="Usado" checked={draft.condition === "used"} onChange={() => set("condition", "used")} />
                  </div>
                </fieldset>
              ) : null}
            </div>
            <Field label="Descripción" htmlFor="producto-descripcion">
              <TextareaCounter
                id="producto-descripcion"
                value={draft.description}
                onChange={(v) => set("description", v)}
                maxLength={600}
                placeholder="Detalles que ayuden a decidir: tamaño, marca, estado…"
              />
            </Field>
          </Card>

          <Card className="space-y-4">
            <Field label="Precio" htmlFor="producto-precio" error={errors.price}>
              <div className="flex">
                <input
                  id="producto-precio"
                  inputMode="decimal"
                  value={draft.price}
                  onChange={(e) => set("price", e.target.value.replace(/[^\d.,]/g, ""))}
                  placeholder="0"
                  aria-invalid={errors.price ? true : undefined}
                  className={cn(inputClass, "rounded-r-none")}
                />
                <label htmlFor="producto-moneda" className="sr-only">
                  Moneda
                </label>
                <Select
                  id="producto-moneda"
                  value={draft.currency}
                  onChange={(e) => set("currency", e.target.value as Currency)}
                  wrapperClassName="w-28 shrink-0"
                  className="rounded-l-none border-l-0 bg-sand"
                >
                  {CURRENCIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </Select>
              </div>
            </Field>

            <fieldset className="space-y-2">
              <legend className="mb-2 text-sm font-semibold">¿Cómo lo vendes?</legend>
              <div className="grid grid-cols-3 gap-2">
                {SALE_MODES.map((m) => (
                  <ToggleChip
                    key={m.id}
                    type="radio"
                    name="modalidad"
                    value={m.id}
                    label={m.label}
                    checked={draft.saleMode === m.id}
                    onChange={() => set("saleMode", m.id)}
                    className="px-2 text-center text-xs leading-tight"
                  />
                ))}
              </div>
            </fieldset>

            {draft.saleMode === "bulk_only" ? (
              <Field label="Venta mínima" htmlFor="producto-minimo" error={errors.minQty} hint="El precio de arriba es por unidad al comprar esa cantidad.">
                <div className="flex items-center gap-2">
                  <input
                    id="producto-minimo"
                    inputMode="numeric"
                    value={draft.minQty}
                    onChange={(e) => set("minQty", e.target.value.replace(/\D/g, ""))}
                    placeholder="10"
                    aria-invalid={errors.minQty ? true : undefined}
                    className={cn(inputClass, "w-28")}
                  />
                  <span className="text-sm text-muted">unidades</span>
                </div>
              </Field>
            ) : null}

            {draft.saleMode !== "unit" ? (
              <fieldset className="space-y-2" aria-describedby={errors.tiers ? "tramos-error" : undefined}>
                <legend className="mb-1 text-sm font-semibold">
                  {draft.saleMode === "bulk_only" ? "Mejores precios por más cantidad (opcional)" : "Precio por cantidad"}
                </legend>
                {draft.tiers.map((t, i) => (
                  <div key={t.key} className="flex items-center gap-2">
                    <label className="flex h-12 flex-1 items-center gap-1.5 rounded-xl border border-line bg-white px-3 text-sm">
                      Desde
                      <input
                        inputMode="numeric"
                        value={t.minQty}
                        aria-label={`Rango ${i + 1}: cantidad mínima`}
                        onChange={(e) =>
                          set("tiers", draft.tiers.map((x) => (x.key === t.key ? { ...x, minQty: e.target.value.replace(/\D/g, "") } : x)))
                        }
                        placeholder={String(6 * (i + 1))}
                        className="w-12 rounded-md bg-sand/60 px-1.5 py-1 text-center font-semibold outline-none focus:ring-2 focus:ring-brand-100"
                      />
                      unid.
                    </label>
                    <div className="flex h-12 w-36 items-center rounded-xl border border-line bg-white">
                      <input
                        inputMode="decimal"
                        value={t.unitPrice}
                        aria-label={`Rango ${i + 1}: precio por unidad en ${draft.currency}`}
                        onChange={(e) =>
                          set("tiers", draft.tiers.map((x) => (x.key === t.key ? { ...x, unitPrice: e.target.value.replace(/[^\d.,]/g, "") } : x)))
                        }
                        placeholder="Precio"
                        className="w-full min-w-0 bg-transparent px-3 outline-none"
                      />
                      <span className="pr-3 text-xs text-muted">{draft.currency}/u</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => set("tiers", draft.tiers.filter((x) => x.key !== t.key))}
                      aria-label={`Quitar rango ${i + 1}`}
                      className="flex size-11 shrink-0 items-center justify-center rounded-xl text-muted"
                    >
                      <Trash2 aria-hidden className="size-5" />
                    </button>
                  </div>
                ))}
                {errors.tiers ? (
                  <p id="tramos-error" className="text-sm font-medium text-danger-600">
                    {errors.tiers}
                  </p>
                ) : null}
                <button
                  type="button"
                  onClick={() => set("tiers", [...draft.tiers, newTier()])}
                  className="flex min-h-11 items-center gap-2 text-sm font-semibold text-brand-700"
                >
                  <CirclePlus aria-hidden className="size-5" />
                  Agregar otro rango
                </button>
              </fieldset>
            ) : null}
          </Card>
        </>
      ) : null}

      {step === 1 ? (
        <>
          <Card>
            <fieldset className="space-y-2">
              <legend className="mb-2 font-bold">¿Quién lo vende?</legend>
              <div className="grid gap-2">
                {sellers.map((s) => (
                  <ToggleChip
                    key={s.key}
                    type="radio"
                    name="vendedor"
                    value={s.key}
                    label={s.label}
                    checked={draft.seller === s.key}
                    onChange={() => chooseSeller(s.key)}
                    className="justify-start px-4"
                  />
                ))}
              </div>
              {seller.payment ? (
                <p className="text-xs text-muted">Usamos las condiciones de la tienda. Puedes cambiarlas solo para este producto.</p>
              ) : null}
            </fieldset>
          </Card>

          <Card className="grid grid-cols-2 gap-3">
            <fieldset className="space-y-2">
              <legend className="mb-2 text-sm font-semibold">Formas de pago</legend>
              <ToggleChip name="pago" value="cash" label="Efectivo" icon={Banknote} checked={draft.payment.includes("cash")} onChange={(on) => set("payment", toggle(draft.payment, "cash", on))} />
              <ToggleChip name="pago" value="transfer" label="Transferencia" icon={ArrowLeftRight} checked={draft.payment.includes("transfer")} onChange={(on) => set("payment", toggle(draft.payment, "transfer", on))} />
              {errors.payment ? <p className="text-sm font-medium text-danger-600">{errors.payment}</p> : null}
            </fieldset>
            <fieldset className="space-y-2">
              <legend className="mb-2 text-sm font-semibold">Entrega</legend>
              <ToggleChip name="entrega" value="pickup" label="Recogida" icon={House} checked={draft.delivery.includes("pickup")} onChange={(on) => set("delivery", toggle(draft.delivery, "pickup", on))} />
              <ToggleChip name="entrega" value="delivery" label="Domicilio" icon={Truck} checked={draft.delivery.includes("delivery")} onChange={(on) => set("delivery", toggle(draft.delivery, "delivery", on))} />
              {errors.delivery ? <p className="text-sm font-medium text-danger-600">{errors.delivery}</p> : null}
            </fieldset>
          </Card>

          <Card className="space-y-4">
            <fieldset className="space-y-2">
              <legend className="text-sm font-semibold">¿Dónde está el producto?</legend>
              <LocationFields
                key={draft.seller}
                idPrefix="producto"
                defaultProvince={draft.province}
                defaultMunicipality={draft.municipality}
                errors={{ province: errors.province, municipality: errors.municipality }}
              />
              <p className="text-xs text-muted">Solo mostramos el municipio, nunca tu dirección exacta.</p>
            </fieldset>
            <Field label="WhatsApp de contacto" htmlFor="producto-whatsapp" error={errors.whatsapp}>
              <div className="relative">
                <MessageCircle aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-brand-600" />
                <input
                  key={draft.seller}
                  id="producto-whatsapp"
                  name="whatsapp"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  defaultValue={draft.whatsapp}
                  placeholder="+53 5 000 0000"
                  aria-invalid={errors.whatsapp ? true : undefined}
                  className={cn(inputClass, "pl-10")}
                />
              </div>
            </Field>
          </Card>
        </>
      ) : null}

      {step === 2 ? <Review draft={draft} sellerLabel={seller.label} remaining={seller.key === "me" ? remainingListings : undefined} planName={planName} /> : null}

      <div className="flex gap-3">
        {step > 0 ? (
          <button
            type="button"
            onClick={() => {
              setErrors({});
              setStep(step - 1);
            }}
            className="h-14 rounded-2xl bg-white px-6 font-semibold ring-1 ring-line"
          >
            Atrás
          </button>
        ) : null}
        <button type="submit" className="h-14 flex-1 rounded-2xl bg-brand-600 text-lg font-semibold text-white shadow-sm">
          {step === 2 ? "Publicar" : "Continuar"}
        </button>
      </div>
    </form>
  );
}

function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cn("rounded-2xl bg-white p-4 shadow-sm ring-1 ring-line/60", className)}>{children}</section>;
}

function Stepper({ step }: { step: number }) {
  return (
    <ol className="flex items-start" aria-label="Pasos">
      {STEPS.map((label, i) => {
        const state = i < step ? "done" : i === step ? "current" : "todo";
        return (
          <li key={label} aria-current={state === "current" ? "step" : undefined} className="relative flex flex-1 flex-col items-center gap-1">
            {i > 0 ? (
              <span
                aria-hidden
                className={cn(
                  "absolute top-4 right-[calc(50%+1.25rem)] h-0.5 w-[calc(100%-2.5rem)]",
                  i <= step ? "bg-brand-500" : "bg-line",
                )}
              />
            ) : null}
            <span
              className={cn(
                "relative flex size-8 items-center justify-center rounded-full text-sm font-bold",
                state === "todo" ? "bg-sand text-muted" : "bg-brand-600 text-white",
              )}
            >
              {state === "done" ? <Check aria-hidden className="size-4" strokeWidth={3} /> : i + 1}
            </span>
            <span className={cn("text-sm", state === "current" ? "font-semibold text-brand-700" : "text-muted")}>{label}</span>
          </li>
        );
      })}
    </ol>
  );
}

function Review({ draft, sellerLabel, remaining, planName }: { draft: Draft; sellerLabel: string; remaining?: number; planName: string }) {
  const price = positive(draft.price);
  const rows = tierRows({
    saleMode: draft.saleMode,
    price,
    minQty: Number(draft.minQty) || undefined,
    tiers: draft.tiers
      .filter((t) => t.minQty && t.unitPrice)
      .map((t) => ({ minQty: Number(t.minQty), unitPrice: positive(t.unitPrice) })),
  });
  const place = [findMunicipality(draft.province, draft.municipality)?.name, findProvince(draft.province)?.name]
    .filter(Boolean)
    .join(", ");
  const details: Array<[string, string]> = [
    ["Categoría", findCategory(draft.category)?.label ?? ""],
    ...(draft.category && !NO_CONDITION.has(draft.category) ? [["Estado", draft.condition === "new" ? "Nuevo" : "Usado"] as [string, string]] : []),
    ["Vende", sellerLabel],
    ["Pago", draft.payment.map((p) => PAYMENT_LABELS[p]).join(" · ")],
    ["Entrega", draft.delivery.map((d) => DELIVERY_LABELS[d]).join(" · ")],
    ["Ubicación", place],
    ["WhatsApp", draft.whatsapp],
  ];
  return (
    <>
      <Card className="flex gap-4">
        {draft.photos[0] ? (
          // eslint-disable-next-line @next/next/no-img-element -- local blob preview
          <img src={draft.photos[0].url} alt="" className="size-28 shrink-0 rounded-xl object-cover" />
        ) : (
          <ProductImage category={draft.category} className="size-28 shrink-0" />
        )}
        <div className="min-w-0 space-y-1">
          <h2 className="text-lg leading-snug font-bold">{draft.title}</h2>
          <p className="text-lg font-bold">
            {formatPrice(price, draft.currency)}
            {draft.saleMode === "bulk_only" ? ` / u · mín. ${draft.minQty}` : ""}
          </p>
          <p className="text-xs text-muted">
            {draft.photos.length === 0 ? "Sin fotos" : draft.photos.length === 1 ? "1 foto" : `${draft.photos.length} fotos`}
          </p>
        </div>
      </Card>
      {rows.length > 0 ? (
        <Card>
          <h3 className="mb-2 text-sm font-bold">Precio por cantidad</h3>
          <ul className="divide-y divide-line text-sm">
            {rows.map((r) => (
              <li key={r.range} className="flex justify-between py-2">
                <span className="text-muted">{r.range} unidades</span>
                <span className="font-semibold">{formatPrice(r.unitPrice, draft.currency)}/u</span>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
      <Card>
        <dl className="divide-y divide-line text-sm">
          {details.map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4 py-2.5">
              <dt className="text-muted">{k}</dt>
              <dd className="text-right font-medium">{v}</dd>
            </div>
          ))}
        </dl>
        {draft.description ? <p className="mt-3 border-t border-line pt-3 text-sm whitespace-pre-line">{draft.description}</p> : null}
      </Card>
      {remaining !== undefined ? (
        <p className="rounded-xl bg-brand-50 px-4 py-3 text-sm text-brand-700">
          Usarás 1 de las {remaining} publicaciones que te quedan en el {planName}.
        </p>
      ) : null}
    </>
  );
}
