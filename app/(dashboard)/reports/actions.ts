"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { uploadReportFile } from "@/lib/services/reports/report-center-service";
import { parseReportUploadFileForm } from "@/lib/validation/reports/report-center";

export async function registerReportUpload(fd: FormData) {
  await uploadReportFile(parseReportUploadFileForm(fd));
  revalidatePath("/reports");
  redirect("/reports");
}
