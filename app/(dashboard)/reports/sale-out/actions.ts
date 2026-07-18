"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSaleOutReport } from "@/lib/services/sales/sale-out-service";
import { parseSaleOutForm } from "@/lib/validation/sales/sale-out";

export async function saveSaleOutReport(fd: FormData) {
  const reportId = await createSaleOutReport(parseSaleOutForm(fd));
  revalidatePath("/reports");
  revalidatePath("/reports/SALE_OUT");
  revalidatePath("/reports/sale-out");
  redirect(`/reports/sale-out/${reportId}`);
}