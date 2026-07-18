"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { importSaleOutUpload, uploadReportFile } from "@/lib/services/reports/report-center-service";
import { parseReportUploadFileForm } from "@/lib/validation/reports/report-center";

export async function registerReportUpload(fd: FormData) {
  await uploadReportFile(parseReportUploadFileForm(fd));
  revalidatePath("/reports");
  redirect("/reports");
}

export async function importSaleOutUploadAction(fd: FormData) {
  const batchId = String(fd.get("batch_id") ?? "");
  if (!batchId) throw new Error("Report upload batch is required");
  await importSaleOutUpload(batchId);
  revalidatePath("/reports");
  revalidatePath("/reports/SALE_OUT");
  revalidatePath("/reports/SALE_OUT");
  redirect("/reports/SALE_OUT");
}
