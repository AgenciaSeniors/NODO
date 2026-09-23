"use client";

import { useState } from "react";
import { Select } from "@/components/forms/field";
import { PROVINCES } from "@/lib/geo/cuba";

type LocationFieldsProps = {
  defaultProvince?: string;
  defaultMunicipality?: string;
  /** Adds "Todos los municipios" (browsing); off when a place is required (store address). */
  allowWholeProvince?: boolean;
  idPrefix: string;
  errors?: { province?: string; municipality?: string };
};

export function LocationFields({
  defaultProvince = "",
  defaultMunicipality = "",
  allowWholeProvince = false,
  idPrefix,
  errors = {},
}: LocationFieldsProps) {
  const [province, setProvince] = useState(defaultProvince);
  const [municipality, setMunicipality] = useState(defaultMunicipality);
  const municipalities = PROVINCES.find((p) => p.id === province)?.municipalities ?? [];

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="space-y-1.5">
        <label htmlFor={`${idPrefix}-provincia`} className="block text-sm text-muted">
          Provincia
        </label>
        <Select
          id={`${idPrefix}-provincia`}
          name="provincia"
          required
          value={province}
          aria-invalid={errors.province ? true : undefined}
          onChange={(e) => {
            setProvince(e.target.value);
            setMunicipality("");
          }}
        >
          <option value="" disabled>
            Elige…
          </option>
          {PROVINCES.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </Select>
        {errors.province ? <p className="text-sm font-medium text-danger-600">{errors.province}</p> : null}
      </div>
      <div className="space-y-1.5">
        <label htmlFor={`${idPrefix}-municipio`} className="block text-sm text-muted">
          Municipio
        </label>
        <Select
          id={`${idPrefix}-municipio`}
          name="municipio"
          required={!allowWholeProvince}
          disabled={!province}
          value={municipality}
          aria-invalid={errors.municipality ? true : undefined}
          onChange={(e) => setMunicipality(e.target.value)}
        >
          {allowWholeProvince ? (
            <option value="">Todos los municipios</option>
          ) : (
            <option value="" disabled>
              Elige…
            </option>
          )}
          {municipalities.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </Select>
        {errors.municipality ? <p className="text-sm font-medium text-danger-600">{errors.municipality}</p> : null}
      </div>
    </div>
  );
}
