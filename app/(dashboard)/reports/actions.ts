"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createReportUpload } from "@/lib/services/reports/report-center-service";
import { parseReportUploadForm } from "@/lib/validation/reports/report-center";

export async function registerReportUpload(fd: FormData) {
  await createReportUpload(parseReportUploadForm(fd));
  revalidatePath("/reports");
  redirect("/reports");
}
