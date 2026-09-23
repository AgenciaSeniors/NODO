import { DemoBanner } from "@/components/layout/demo-banner";
// Detail screens (a product) take the whole screen: no tab bar, their own sticky actions.
export default function DetailLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col overflow-x-clip bg-cream shadow-xl shadow-ink/5">
      <DemoBanner />
      <main className="flex-1 pb-[calc(6rem+env(safe-area-inset-bottom))]">{children}</main>
    </div>
  );
}
