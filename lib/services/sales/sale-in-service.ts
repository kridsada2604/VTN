import { getCurrentCompanyId } from "@/lib/current-company";
import { SaleInRepository } from "@/lib/repositories/sales/sale-in-repository";
import { createClient } from "@/lib/supabase/server";
import { computeSaleInItems } from "./sale-in-calculator";
import { validateSaleInInput, type CreateSaleInInput } from "@/lib/validation/sales/sale-in";
import type { SaleInReportFilters } from "@/lib/repositories/sales/sale-in-repository";

export async function getSaleInReportPreview(filters: SaleInReportFilters) {
  const supabase = await createClient();
  const companyId = await getCurrentCompanyId();
  return new SaleInRepository(supabase).reportPreview(companyId, filters);
}

export async function createSaleInReport(input: CreateSaleInInput) {
  validateSaleInInput(input);
  const supabase = await createClient();
  const companyId = await getCurrentCompanyId();
  const { computedItems, totals } = computeSaleInItems(input.items);
  return new SaleInRepository(supabase).create(companyId, input, computedItems, totals);
}
