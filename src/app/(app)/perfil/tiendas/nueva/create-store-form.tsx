"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeftRight, Banknote, Clock, House, MessageCircle, Plus, Truck, X } from "lucide-react";
import { Field, inputClass, Select } from "@/components/forms/field";
import { LocationFields } from "@/components/forms/location-fields";
import { TextareaCounter } from "@/components/forms/textarea-counter";
import { ToggleChip } from "@/components/forms/toggle-chip";
import { CATEGORIES } from "@/lib/catalog";
import { cn } from "@/lib/cn";
import { normalizePhone } from "@/lib/phone";
import type { DeliveryMethod, PaymentMethod } from "@/lib/types";

type Errors = Partial<Record<"name" | "category" | "province" | "municipality" | "whatsapp" | "payment" | "delivery", string>>;

export function CreateStoreForm({ defaultProvince, defaultMunicipality }: { defaultProvince?: string; defaultMunicipality?: string }) {
  const router = useRouter();
  const [logo, setLogo] = useState<string>();
  const [description, setDescription] = useState("");
  const [payment, setPayment] = useState<PaymentMethod[]>(["cash"]);
  const [delivery, setDelivery] = useState<DeliveryMethod[]>(["pickup"]);
  const [errors, setErrors] = useState<Errors>({});

  const toggle = <T,>(list: T[], value: T, on: boolean) => (on ? [...list, value] : list.filter((v) => v !== value));

  // Field name → error key, so fixing a field clears its message.
  const FIELD_ERRORS: Record<string, keyof Errors> = {
    nombre: "name",
    categoria: "category",
    provincia: "province",
    municipio: "municipality",
    whatsapp: "whatsapp",
    pago: "payment",
    entrega: "delivery",
  };
  function clearError(event: FormEvent<HTMLFormElement>) {
    const key = FIELD_ERRORS[(event.target as HTMLInputElement).name];
    if (key && errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const name = String(data.get("nombre") ?? "").trim();
    const category = String(data.get("categoria") ?? "");
    const province = String(data.get("provincia") ?? "");
    const municipality = String(data.get("municipio") ?? "");
    const whatsapp = normalizePhone(String(data.get("whatsapp") ?? ""));

    const next: Errors = {};
    if (name.length < 2) next.name = "Escribe el nombre de la tienda.";
    if (!category) next.category = "Elige una categoría.";
    if (!province) next.province = "Elige la provincia.";
    if (!municipality) next.municipality = "Elige el municipio.";
    if (!whatsapp) next.whatsapp = "Escribe un móvil cubano de 8 dígitos (empieza por 5 o 6).";
    if (payment.length === 0) next.payment = "Marca al menos una forma de pago.";
    if (delivery.length === 0) next.delivery = "Marca al menos una forma de entrega.";
    setErrors(next);
    if (Object.keys(next).length > 0) {
      // Wait for the error state to render, then take the user to the first problem.
      requestAnimationFrame(() => form.querySelector<HTMLElement>("[aria-invalid='true']")?.focus());
      return;
    }

    // Until the database is connected the new store only travels to the
    // confirmation screen; nothing is stored yet.
    const params = new URLSearchParams({ nombre: name, categoria: category, provincia: province, municipio: municipality, whatsapp: whatsapp! });
    router.push(`/perfil/tiendas/creada?${params}`);
  }

  return (
    <form onSubmit={submit} onChange={clearError} noValidate className="space-y-5">
      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-3">
        <div className="space-y-1.5">
          <p className="text-sm font-semibold" id="logo-label">
            Foto o logo
          </p>
          <label
            htmlFor="tienda-logo"
            className="relative flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 overflow-hidden rounded-2xl border-2 border-dashed border-line bg-white text-center text-sm font-medium has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand-500"
          >
            {logo ? (
              // eslint-disable-next-line @next/next/no-img-element -- local blob preview
              <img src={logo} alt="Logo elegido" className="absolute inset-0 size-full object-cover" />
            ) : (
              <>
                <span className="flex size-10 items-center justify-center rounded-full bg-sand">
                  <Plus aria-hidden className="size-5" />
                </span>
                Agregar logo o foto
                <span className="text-xs font-normal text-muted">JPG o PNG · Máx. 5 MB</span>
              </>
            )}
            <input
              id="tienda-logo"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              aria-labelledby="logo-label"
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                if (logo) URL.revokeObjectURL(logo);
                setLogo(URL.createObjectURL(file));
              }}
            />
          </label>
          {logo ? (
            <button
              type="button"
              onClick={() => {
                URL.revokeObjectURL(logo);
                setLogo(undefined);
              }}
              className="flex min-h-11 items-center gap-1 text-sm text-muted"
            >
              <X aria-hidden className="size-4" /> Quitar
            </button>
          ) : null}
        </div>
        <div className="space-y-4">
          <Field label="Nombre de la tienda" htmlFor="tienda-nombre" error={errors.name}>
            <input
              id="tienda-nombre"
              name="nombre"
              maxLength={60}
              autoComplete="organization"
              placeholder="Ej. Mercado El Sol"
              aria-invalid={errors.name ? true : undefined}
              aria-describedby={errors.name ? "tienda-nombre-error" : undefined}
              className={inputClass}
            />
          </Field>
          <Field label="Categoría" htmlFor="tienda-categoria" error={errors.category}>
            <Select
              id="tienda-categoria"
              name="categoria"
              defaultValue=""
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
        </div>
      </div>

      <Field label="Descripción breve" htmlFor="tienda-descripcion">
        <TextareaCounter
          id="tienda-descripcion"
          value={description}
          onChange={setDescription}
          maxLength={200}
          placeholder="¿Qué vendes? Ej. Productos frescos, frutas, verduras y lácteos."
        />
      </Field>

      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold">Ubicación</legend>
        <LocationFields
          idPrefix="tienda"
          defaultProvince={defaultProvince}
          defaultMunicipality={defaultMunicipality}
          errors={{ province: errors.province, municipality: errors.municipality }}
        />
      </fieldset>

      <Field label="Dirección" htmlFor="tienda-direccion" hint="Opcional. Calle, número y entre calles.">
        <input
          id="tienda-direccion"
          name="direccion"
          autoComplete="street-address"
          placeholder="Ej. Calle 23 entre F y G, Vedado"
          className={inputClass}
        />
      </Field>

      <div className="grid gap-5">
        <Field label="WhatsApp / Teléfono" htmlFor="tienda-whatsapp" error={errors.whatsapp}>
          <div className="relative">
            <MessageCircle aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-brand-600" />
            <input
              id="tienda-whatsapp"
              name="whatsapp"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="+53 5 000 0000"
              aria-invalid={errors.whatsapp ? true : undefined}
              aria-describedby={errors.whatsapp ? "tienda-whatsapp-error" : undefined}
              className={cn(inputClass, "pl-10")}
            />
          </div>
        </Field>
        <Field label="Horario" htmlFor="tienda-horario">
          <div className="relative">
            <Clock aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-muted" />
            <input
              id="tienda-horario"
              name="horario"
              placeholder="Lun – Sáb · 8 AM – 8 PM"
              className={cn(inputClass, "pl-10")}
            />
          </div>
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <fieldset className="space-y-2" aria-describedby={errors.payment ? "pago-error" : undefined}>
          <legend className="text-sm font-semibold">Formas de pago</legend>
          <div className="grid gap-2">
            <ToggleChip name="pago" value="cash" label="Efectivo" icon={Banknote} checked={payment.includes("cash")} onChange={(on) => setPayment(toggle(payment, "cash", on))} />
            <ToggleChip name="pago" value="transfer" label="Transferencia" icon={ArrowLeftRight} checked={payment.includes("transfer")} onChange={(on) => setPayment(toggle(payment, "transfer", on))} />
          </div>
          {errors.payment ? <p id="pago-error" className="text-sm font-medium text-danger-600">{errors.payment}</p> : null}
        </fieldset>
        <fieldset className="space-y-2" aria-describedby={errors.delivery ? "entrega-error" : undefined}>
          <legend className="text-sm font-semibold">Entrega</legend>
          <div className="grid gap-2">
            <ToggleChip name="entrega" value="pickup" label="Recogida en tienda" icon={House} checked={delivery.includes("pickup")} onChange={(on) => setDelivery(toggle(delivery, "pickup", on))} />
            <ToggleChip name="entrega" value="delivery" label="Domicilio" icon={Truck} checked={delivery.includes("delivery")} onChange={(on) => setDelivery(toggle(delivery, "delivery", on))} />
          </div>
          {errors.delivery ? <p id="entrega-error" className="text-sm font-medium text-danger-600">{errors.delivery}</p> : null}
        </fieldset>
      </div>

      <button type="submit" className="h-14 w-full rounded-2xl bg-brand-600 text-lg font-semibold text-white shadow-sm">
        Crear tienda
      </button>
    </form>
  );
}
