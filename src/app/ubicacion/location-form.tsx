"use client";

import { useActionState } from "react";
import { LocationFields } from "@/components/forms/location-fields";
import { saveLocation, type LocationFormState } from "./actions";

export function LocationForm(props: { province?: string; municipality?: string; returnTo: string }) {
  const [state, action, pending] = useActionState<LocationFormState, FormData>(saveLocation, {});
  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="volver" value={props.returnTo} />
      <LocationFields
        idPrefix="ubicacion"
        defaultProvince={props.province}
        defaultMunicipality={props.municipality}
        allowWholeProvince
        errors={{ province: state.error }}
      />
      <button
        type="submit"
        disabled={pending}
        className="h-13 w-full rounded-2xl bg-brand-600 text-lg font-semibold text-white shadow-sm disabled:opacity-60"
      >
        {pending ? "Guardando…" : "Continuar"}
      </button>
    </form>
  );
}
