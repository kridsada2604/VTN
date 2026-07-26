import { getCurrentCompanyId } from "@/lib/current-company";
import { CommissionRepository } from "@/lib/repositories/reports/commission-repository";
import { createClient } from "@/lib/supabase/server";
import type { CommissionFilters } from "@/lib/repositories/reports/commission-repository";
import type { CreateCommissionRuleInput, CreateCommissionRunInput } from "@/lib/validation/reports/commission";

export async function getCommissionDashboard(filters: CommissionFilters) {
  const supabase = await createClient();
  const companyId = await getCurrentCompanyId();
  return new CommissionRepository(supabase).dashboard(companyId, filters);
}

export async function createCommissionRule(input: CreateCommissionRuleInput) {
  const supabase = await createClient();
  const companyId = await getCurrentCompanyId();
  return new CommissionRepository(supabase).createRule(companyId, input);
}

export async function createCommissionRun(input: CreateCommissionRunInput) {
  const supabase = await createClient();
  const companyId = await getCurrentCompanyId();
  return new CommissionRepository(supabase).createRun(companyId, input);
}
