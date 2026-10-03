"use server";

import { redirect } from "next/navigation";
import { getViewer } from "@/lib/auth";
import { parseReportForm, type FieldErrors } from "@/lib/listing-input";
import { DEMO_MODE } from "@/lib/mode";
import { isUuid } from "@/lib/search";
import { createClient } from "@/lib/supabase/server";

export type ReportResult = { error?: string; errors?: FieldErrors };

/** Files a report on a listing. Reports are write-only from the app: nobody reads them back here. */
export async function reportProduct(productId: string, data: FormData): Promise<ReportResult> {
  const { input, errors } = parseReportForm(data);
  if (!input) return { errors };

  if (DEMO_MODE) redirect(`/producto/${productId}?reportado=1`);

  const viewer = await getViewer();
  if (!viewer) return { error: "Tu sesión se cerró. Vuelve a entrar para enviar el reporte." };
  if (!isUuid(productId)) return { error: "No encontramos esa publicación." };

  const supabase = await createClient();
  const { error } = await supabase.from("reports").insert({
    product_id: productId,
    reason: input.reason,
    details: input.details || null,
  });
  if (error) {
    console.error(`[supabase] report product: ${error.message}`);
    return { error: "No pudimos enviar el reporte. Revisa tu conexión y vuelve a intentarlo." };
  }
  redirect(`/producto/${productId}?reportado=1`);
}
