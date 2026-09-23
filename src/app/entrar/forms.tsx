"use client";

import { useActionState } from "react";
import { Mail, UserRound } from "lucide-react";
import { Field, inputClass } from "@/components/forms/field";
import { cn } from "@/lib/cn";
import { saveName, sendCode, verifyCode, type AuthFormState } from "./actions";

const primary =
  "h-13 w-full rounded-2xl bg-brand-600 text-lg font-semibold text-white shadow-sm disabled:opacity-60";

function ErrorText({ id, error }: { id: string; error?: string }) {
  return error ? (
    <p id={id} role="alert" className="text-sm font-medium text-danger-600">
      {error}
    </p>
  ) : null;
}

export function EmailForm({ returnTo, email }: { returnTo: string; email?: string }) {
  const [state, action, pending] = useActionState<AuthFormState, FormData>(sendCode, {});
  return (
    <form action={action} className="space-y-4" noValidate>
      <input type="hidden" name="volver" value={returnTo} />
      <Field label="Tu correo" htmlFor="entrar-correo">
        <div className="relative">
          <Mail aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-muted" />
          <input
            id="entrar-correo"
            name="correo"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            required
            defaultValue={email}
            placeholder="nombre@gmail.com"
            aria-invalid={state.error ? true : undefined}
            aria-describedby={state.error ? "entrar-correo-error" : undefined}
            className={cn(inputClass, "pl-10")}
          />
        </div>
      </Field>
      <ErrorText id="entrar-correo-error" error={state.error} />
      <button type="submit" disabled={pending} className={primary}>
        {pending ? "Enviando…" : "Enviarme el código"}
      </button>
    </form>
  );
}

export function CodeForm({ email, returnTo }: { email: string; returnTo: string }) {
  const [state, action, pending] = useActionState<AuthFormState, FormData>(verifyCode, {});
  return (
    <form action={action} className="space-y-4" noValidate>
      <input type="hidden" name="volver" value={returnTo} />
      <input type="hidden" name="correo" value={email} />
      <Field label="Código" htmlFor="entrar-codigo">
        <input
          id="entrar-codigo"
          name="codigo"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={10}
          required
          autoFocus
          placeholder="000000"
          aria-invalid={state.error ? true : undefined}
          aria-describedby={state.error ? "entrar-codigo-error" : undefined}
          className={cn(inputClass, "h-14 text-center text-2xl font-bold tracking-[0.4em] placeholder:tracking-[0.4em]")}
        />
      </Field>
      <ErrorText id="entrar-codigo-error" error={state.error} />
      <button type="submit" disabled={pending} className={primary}>
        {pending ? "Comprobando…" : "Entrar"}
      </button>
    </form>
  );
}

export function ResendForm({ email, returnTo }: { email: string; returnTo: string }) {
  const [state, action, pending] = useActionState<AuthFormState, FormData>(sendCode, {});
  return (
    <form action={action} className="space-y-1">
      <input type="hidden" name="volver" value={returnTo} />
      <input type="hidden" name="correo" value={email} />
      <input type="hidden" name="reenviar" value="1" />
      <button type="submit" disabled={pending} className="min-h-11 font-semibold text-brand-700 disabled:opacity-60">
        {pending ? "Enviando…" : "Enviarme otro código"}
      </button>
      <ErrorText id="reenviar-error" error={state.error} />
    </form>
  );
}

export function NameForm({ returnTo, name }: { returnTo: string; name?: string }) {
  const [state, action, pending] = useActionState<AuthFormState, FormData>(saveName, {});
  return (
    <form action={action} className="space-y-4" noValidate>
      <input type="hidden" name="volver" value={returnTo} />
      <Field label="Nombre y apellido" htmlFor="entrar-nombre">
        <div className="relative">
          <UserRound aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-muted" />
          <input
            id="entrar-nombre"
            name="nombre"
            autoComplete="name"
            maxLength={80}
            required
            autoFocus
            defaultValue={name}
            placeholder="Ej. Carlos Martínez"
            aria-invalid={state.error ? true : undefined}
            aria-describedby={state.error ? "entrar-nombre-error" : undefined}
            className={cn(inputClass, "pl-10")}
          />
        </div>
      </Field>
      <ErrorText id="entrar-nombre-error" error={state.error} />
      <button type="submit" disabled={pending} className={primary}>
        {pending ? "Guardando…" : "Continuar"}
      </button>
    </form>
  );
}
