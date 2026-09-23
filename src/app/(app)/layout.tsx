import { BottomNav } from "@/components/layout/bottom-nav";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col overflow-x-clip bg-cream shadow-xl shadow-ink/5">
      <p className="bg-brand-700 px-4 py-1.5 text-center text-xs font-medium text-white">
        Versión de prueba · los datos son de ejemplo
      </p>
      <main className="flex-1 pb-[calc(6rem+env(safe-area-inset-bottom))]">{children}</main>
      <BottomNav />
    </div>
  );
}
