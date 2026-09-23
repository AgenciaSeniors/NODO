import { DemoBanner } from "@/components/layout/demo-banner";
import { BottomNav } from "@/components/layout/bottom-nav";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col overflow-x-clip bg-cream shadow-xl shadow-ink/5">
      <DemoBanner />
      <main className="flex-1 pb-[calc(6rem+env(safe-area-inset-bottom))]">{children}</main>
      <BottomNav />
    </div>
  );
}
