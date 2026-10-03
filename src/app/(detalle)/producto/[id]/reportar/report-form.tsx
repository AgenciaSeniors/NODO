"use client";

import { useState, useTransition, type FormEvent } from "react";
import { unstable_rethrow } from "next/navigation";
import { Field } from "@/components/forms/field";
import { TextareaCounter } from "@/components/forms/textarea-counter";
import { ToggleChip } from "@/components/forms/toggle-chip";
import { REPORT_REASON_LABELS } from "@/lib/catalog";
import { parseReportForm } from "@/lib/listing-input";
import type { ReportReason } from "@/lib/types";
import { reportProduct } from "./actions";

const REASONS = Object.entries(REPORT_REASON_LABELS) as Array<[ReportReason, string]>;

export function ReportForm({ productId }: { productId: string }) {
  const [reason, setReason] = useState<ReportReason>();
  const [details, setDetails] = useState("");
  const [reasonError, setReasonError] = useState<string>();
  const [formError, setFormError] = useState<string>();
  const [saving, startSaving] = useTransition();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const { errors } = parseReportForm(data);
    if (errors.reason) {
      setReasonError(errors.reason);
      return;
    }
    setReasonError(undefined);
    setFormError(undefined);
    startSaving(async () => {
      let result: { error?: string };
      try {
        result = await reportProduct(productId, data);
      } catch (error) {
        // On success the server redirects to the listing: let that through.
        unstable_rethrow(error);
        result = { error: "No pudimos enviar el reporte. Revisa tu conexión y vuelve a intentarlo." };
      }
      setFormError(result.error);
    });
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      <fieldset className="space-y-2" aria-describedby={reasonError ? "motivo-error" : undefined}>
        <legend className="mb-1 font-bold">¿Qué pasa con esta publicación?</legend>
        <div className="grid gap-2">
          {REASONS.map(([value, label]) => (
            <ToggleChip
              key={value}
              type="radio"
              name="motivo"
              value={value}
              label={label}
              checked={reason === value}
              onChange={() => {
                setReason(value);
                setReasonError(undefined);
              }}
              className="justify-start px-4"
            />
          ))}
        </div>
        {reasonError ? (
          <p id="motivo-error" className="text-sm font-medium text-danger-600">
            {reasonError}
          </p>
        ) : null}
      </fieldset>

      <Field label="Cuéntanos más" htmlFor="reporte-detalles" hint="Opcional. Ayuda al equipo de NODO a revisarlo.">
        <TextareaCounter
          id="reporte-detalles"
          name="detalles"
          value={details}
          onChange={setDetails}
          maxLength={500}
          placeholder="Ej. Me pidió pagar por adelantado antes de entregar nada."
        />
      </Field>

      {formError ? (
        <p role="alert" className="rounded-xl bg-danger-50 px-4 py-3 text-sm font-medium text-danger-600">
          {formError}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={saving}
        className="h-14 w-full rounded-2xl bg-brand-600 text-lg font-semibold text-white shadow-sm disabled:opacity-60"
      >
        {saving ? "Enviando…" : "Enviar reporte"}
      </button>
    </form>
  );
}
