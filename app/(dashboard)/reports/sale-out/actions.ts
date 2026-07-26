"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSaleOutReport, updateSaleOutStatus } from "@/lib/services/sales/sale-out-service";
import { parseSaleOutForm, parseSaleOutStatusForm } from "@/lib/validation/sales/sale-out";

export async function saveSaleOutReport(fd: FormData) {
  const reportId = await createSaleOutReport(parseSaleOutForm(fd));
  revalidatePath("/reports");
  revalidatePath("/reports/SALE_OUT");
  revalidatePath("/reports/sale-out");
  redirect(`/reports/sale-out/${reportId}`);
}

export async function approveSaleOutReport(fd: FormData) {
  const reportId = String(fd.get("report_id") ?? "");
  await updateSaleOutStatus(parseSaleOutStatusForm(fd, "APPROVED"));
  revalidateSaleOutPaths(reportId);
}

export async function cancelSaleOutReport(fd: FormData) {
  const reportId = String(fd.get("report_id") ?? "");
  await updateSaleOutStatus(parseSaleOutStatusForm(fd, "CANCELLED"));
  revalidateSaleOutPaths(reportId);
}

function revalidateSaleOutPaths(reportId: string) {
  revalidatePath("/reports");
  revalidatePath("/reports/SALE_OUT");
  revalidatePath("/reports/sale-out");
  if (reportId) revalidatePath(`/reports/sale-out/${reportId}`);
}
