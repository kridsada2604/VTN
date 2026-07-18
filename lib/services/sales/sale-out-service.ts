import { getCurrentCompanyId } from "@/lib/current-company";
import { SaleOutRepository } from "@/lib/repositories/sales/sale-out-repository";
import { createClient } from "@/lib/supabase/server";
import { computeSaleOutItems } from "./sale-out-calculator";
import type { CreateSaleOutInput } from "@/lib/validation/sales/sale-out";
import type { SaleOutReportFilters } from "@/lib/repositories/sales/sale-out-repository";

export async function getSaleOutDashboard() {
  const supabase = await createClient();
  const companyId = await getCurrentCompanyId();
  return new SaleOutRepository(supabase).dashboard(companyId);
}

export async function getSaleOutReportPreview(filters: SaleOutReportFilters) {
  const supabase = await createClient();
  const companyId = await getCurrentCompanyId();
  return new SaleOutRepository(supabase).reportPreview(companyId, filters);
}

export async function getSaleOutFormOptions() {
  const supabase = await createClient();
  const companyId = await getCurrentCompanyId();
  return new SaleOutRepository(supabase).getFormOptions(companyId);
}

export async function getSaleOutDetail(reportId: string) {
  const supabase = await createClient();
  const companyId = await getCurrentCompanyId();
  return new SaleOutRepository(supabase).getById(companyId, reportId);
}

export async function createSaleOutReport(input: CreateSaleOutInput) {
  const supabase = await createClient();
  const companyId = await getCurrentCompanyId();
  const { computedItems, totals } = computeSaleOutItems(input.items);
  return new SaleOutRepository(supabase).create(companyId, input, computedItems, totals);
}