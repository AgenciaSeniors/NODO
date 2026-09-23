import Link from "next/link";
import { Logo } from "@/components/brand/logo";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-5 bg-cream px-6 text-center">
      <Logo className="h-10 w-auto" />
      <h1 className="text-2xl font-bold">No encontramos esta página</h1>
      <p className="text-muted">Puede que la publicación ya no exista o que el enlace esté incompleto.</p>
      <Link href="/" className="flex h-12 items-center rounded-2xl bg-brand-600 px-6 font-semibold text-white">
        Ir al inicio
      </Link>
    </main>
  );
}
