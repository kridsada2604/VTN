import { getCurrentCompanyId } from "@/lib/current-company";
import { ReportCenterRepository } from "@/lib/repositories/reports/report-center-repository";
import { createClient } from "@/lib/supabase/server";
import type { CreateReportUploadInput } from "@/lib/validation/reports/report-center";

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
