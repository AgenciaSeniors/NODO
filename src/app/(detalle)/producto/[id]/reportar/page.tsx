import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppHeader } from "@/components/layout/app-header";
import { canEditListing, requireViewer } from "@/lib/auth";
import { getProduct } from "@/lib/data";
import { DEMO_MODE } from "@/lib/mode";
import { ReportForm } from "./report-form";

export const metadata: Metadata = { title: "Reportar publicación" };

export default async function ReportProductPage({ params }: PageProps<"/producto/[id]/reportar">) {
  const { id } = await params;
  const user = await requireViewer(`/producto/${id}/reportar`);
  const product = await getProduct(id);
  // Reporting your own listing makes no sense.
  if (!product || (!DEMO_MODE && canEditListing(product, user))) notFound();

  return (
    <>
      <AppHeader backHref={`/producto/${id}`} action="none" />
      <div className="space-y-5 px-4 pb-8">
        <h1 className="text-2xl font-bold">Reportar publicación</h1>
        <p className="text-sm text-muted">«{product.title}»</p>
        <ReportForm productId={product.id} />
      </div>
    </>
  );
}
