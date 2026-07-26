import { getCurrentCompanyId } from "@/lib/current-company";
import { MonthOfInventoryRepository } from "@/lib/repositories/reports/month-of-inventory-repository";
import { createClient } from "@/lib/supabase/server";
import { computeMonthOfInventoryItems } from "./month-of-inventory-calculator";
import { validateMonthOfInventoryInput, type CreateMonthOfInventoryInput } from "@/lib/validation/reports/month-of-inventory";
import type { MonthOfInventoryFilters } from "@/lib/repositories/reports/month-of-inventory-repository";

export async function getMonthOfInventoryPreview(filters: MonthOfInventoryFilters) {
  const supabase = await createClient();
  const companyId = await getCurrentCompanyId();
  return new MonthOfInventoryRepository(supabase).preview(companyId, filters);
}

export async function createMonthOfInventoryReport(input: CreateMonthOfInventoryInput) {
  validateMonthOfInventoryInput(input);
  const supabase = await createClient();
  const companyId = await getCurrentCompanyId();
  const { computedItems, totals } = computeMonthOfInventoryItems(input.items);
  return new MonthOfInventoryRepository(supabase).create(companyId, input, computedItems, totals);
}
