import { getCurrentCompanyId } from "@/lib/current-company";
import { ReportCenterRepository } from "@/lib/repositories/reports/report-center-repository";
import { createClient } from "@/lib/supabase/server";
import type { CreateReportUploadInput, CreateReportUploadWithFileInput } from "@/lib/validation/reports/report-center";

const REPORT_IMPORT_BUCKET = "report-imports";

function safeFileName(fileName: string) {
  return fileName
    .normalize("NFKD")
    .replace(/[^\w.\-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 140) || "report-file";
}

export async function getReportCenterDashboard() {
  const supabase = await createClient();
  const companyId = await getCurrentCompanyId();
  return new ReportCenterRepository(supabase).dashboard(companyId);
}

export async function createReportUpload(input: CreateReportUploadInput) {
  const supabase = await createClient();
  const companyId = await getCurrentCompanyId();
  return new ReportCenterRepository(supabase).createUpload(companyId, input);
}

export async function uploadReportFile(input: CreateReportUploadWithFileInput) {
  const supabase = await createClient();
  const companyId = await getCurrentCompanyId();
  const safeName = safeFileName(input.file.name);
  const periodFolder = input.metadata.period_start?.slice(0, 7) ?? new Date().toISOString().slice(0, 7);
  const storagePath = `${companyId}/${input.metadata.report_type.toLowerCase()}/${periodFolder}/${crypto.randomUUID()}-${safeName}`;

  const { error: uploadError } = await supabase.storage.from(REPORT_IMPORT_BUCKET).upload(storagePath, input.file, {
    contentType: input.file.type || "application/octet-stream",
    upsert: false,
  });

  if (uploadError) throw uploadError;

  return new ReportCenterRepository(supabase).createUpload(companyId, {
    ...input.metadata,
    file_name: input.file.name,
    file_size_bytes: input.file.size,
    storage_bucket: REPORT_IMPORT_BUCKET,
    storage_path: storagePath,
  });
}

export async function getReportCenterCategory(reportType: string) {
  const supabase = await createClient();
  const companyId = await getCurrentCompanyId();
  return new ReportCenterRepository(supabase).getCategory(companyId, reportType);
}
