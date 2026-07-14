import { getCurrentCompanyId } from "@/lib/current-company";
import { CrmRepository } from "@/lib/repositories/crm/crm-repository";
import { createClient } from "@/lib/supabase/server";
import type { CreateLeadInput } from "@/lib/validation/crm/lead";

export async function getCrmDashboard() {
  const supabase = await createClient();
  const companyId = await getCurrentCompanyId();
  return new CrmRepository(supabase).getDashboard(companyId);
}

export async function createLead(input: CreateLeadInput) {
  const supabase = await createClient();
  const companyId = await getCurrentCompanyId();
  return new CrmRepository(supabase).createLead(companyId, input);
}
