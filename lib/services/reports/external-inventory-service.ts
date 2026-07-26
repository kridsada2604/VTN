import { getCurrentCompanyId } from "@/lib/current-company";
import { ExternalInventoryRepository } from "@/lib/repositories/reports/external-inventory-repository";
import { createClient } from "@/lib/supabase/server";
import { computeExternalInventoryItems } from "./external-inventory-calculator";
import { validateInventoryExternalInput, type CreateInventoryExternalInput } from "@/lib/validation/reports/external-inventory";
import type { ExternalInventoryFilters } from "@/lib/repositories/reports/external-inventory-repository";

export async function getExternalInventoryPreview(filters: ExternalInventoryFilters) {
  const supabase = await createClient();
  const companyId = await getCurrentCompanyId();
  return new ExternalInventoryRepository(supabase).preview(companyId, filters);
}

export async function createExternalInventoryReport(input: CreateInventoryExternalInput) {
  validateInventoryExternalInput(input);
  const supabase = await createClient();
  const companyId = await getCurrentCompanyId();
  const { computedItems, totals } = computeExternalInventoryItems(input.items);
  return new ExternalInventoryRepository(supabase).create(companyId, input, computedItems, totals);
}
