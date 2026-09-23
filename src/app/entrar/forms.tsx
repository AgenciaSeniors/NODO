"use client";

import { useActionState, useState } from "react";
import { Eye, EyeOff, LockKeyhole, Mail, UserRound } from "lucide-react";
import { Field, inputClass } from "@/components/forms/field";
import { MIN_PASSWORD } from "@/lib/account-input";
import { cn } from "@/lib/cn";
import {
  saveName,
  sendCode,
  signInWithPassword,
  signUpWithPassword,
  verifyCode,
  type AuthFormState,
} from "./actions";

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
            defaultValue={state.email ?? email}
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
            defaultValue={state.name ?? name}
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

function EmailField({ id, error, defaultValue }: { id: string; error?: string; defaultValue?: string }) {
  return (
    <Field label="Correo" htmlFor={id} error={error}>
      <div className="relative">
        <Mail aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-muted" />
        <input
          id={id}
          name="correo"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          required
          defaultValue={defaultValue}
          placeholder="nombre@gmail.com"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className={cn(inputClass, "pl-10")}
        />
      </div>
    </Field>
  );
}

/** Password with a show/hide button: typing blind on a phone is error-prone. */
function PasswordField({ id, error, isNew }: { id: string; error?: string; isNew: boolean }) {
  const [visible, setVisible] = useState(false);
  return (
    <Field
      label="Contraseña"
      htmlFor={id}
      error={error}
      hint={isNew ? `Al menos ${MIN_PASSWORD} caracteres.` : undefined}
    >
      <div className="relative">
        <LockKeyhole aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-muted" />
        <input
          id={id}
          name="contrasena"
          type={visible ? "text" : "password"}
          autoComplete={isNew ? "new-password" : "current-password"}
          autoCapitalize="none"
          spellCheck={false}
          required
          minLength={isNew ? MIN_PASSWORD : undefined}
          maxLength={72}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className={cn(inputClass, "px-10")}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
          aria-pressed={visible}
          className="absolute top-1/2 right-0 flex size-12 -translate-y-1/2 items-center justify-center text-muted"
        >
          {visible ? <EyeOff aria-hidden className="size-5" /> : <Eye aria-hidden className="size-5" />}
        </button>
      </div>
    </Field>
  );
}

export function PasswordSignInForm({ returnTo }: { returnTo: string }) {
  const [state, action, pending] = useActionState<AuthFormState, FormData>(signInWithPassword, {});
  return (
    <form action={action} className="space-y-4" noValidate>
      <input type="hidden" name="volver" value={returnTo} />
      <EmailField id="entrar-correo" error={state.errors?.email} defaultValue={state.email} />
      <PasswordField id="entrar-contrasena" error={state.errors?.password} isNew={false} />
      <ErrorText id="entrar-error" error={state.error} />
      <button type="submit" disabled={pending} className={primary}>
        {pending ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}

export function SignUpForm({ returnTo }: { returnTo: string }) {
  const [state, action, pending] = useActionState<AuthFormState, FormData>(signUpWithPassword, {});
  return (
    <form action={action} className="space-y-4" noValidate>
      <input type="hidden" name="volver" value={returnTo} />
      <Field
        label="Nombre y apellido"
        htmlFor="crear-nombre"
        error={state.errors?.name}
        hint="En público solo mostramos tu nombre y la inicial del apellido."
      >
        <div className="relative">
          <UserRound aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-muted" />
          <input
            id="crear-nombre"
            name="nombre"
            autoComplete="name"
            maxLength={80}
            required
            defaultValue={state.name}
            placeholder="Ej. Carlos Martínez"
            aria-invalid={state.errors?.name ? true : undefined}
            aria-describedby={state.errors?.name ? "crear-nombre-error" : undefined}
            className={cn(inputClass, "pl-10")}
          />
        </div>
      </Field>
      <EmailField id="crear-correo" error={state.errors?.email} defaultValue={state.email} />
      <PasswordField id="crear-contrasena" error={state.errors?.password} isNew />
      <ErrorText id="crear-error" error={state.error} />
      <button type="submit" disabled={pending} className={primary}>
        {pending ? "Creando tu cuenta…" : "Crear cuenta"}
      </button>
    </form>
  );
}
