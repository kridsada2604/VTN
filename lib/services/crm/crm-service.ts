import { getCurrentCompanyId } from "@/lib/current-company";
import { CrmRepository } from "@/lib/repositories/crm/crm-repository";
import { createClient } from "@/lib/supabase/server";
import type { CreateActivityInput, CreateLeadInput, CreateOpportunityInput, UpdateOpportunityStageInput } from "@/lib/validation/crm/lead";

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

export async function createOpportunity(input: CreateOpportunityInput) {
  const supabase = await createClient();
  const companyId = await getCurrentCompanyId();
  return new CrmRepository(supabase).createOpportunity(companyId, input);
}

export async function updateOpportunityStage(input: UpdateOpportunityStageInput) {
  const supabase = await createClient();
  const companyId = await getCurrentCompanyId();
  return new CrmRepository(supabase).updateOpportunityStage(companyId, input);
}

export async function createActivity(input: CreateActivityInput) {
  const supabase = await createClient();
  const companyId = await getCurrentCompanyId();
  return new CrmRepository(supabase).createActivity(companyId, input);
}

export async function completeActivity(activityId: string) {
  const supabase = await createClient();
  const companyId = await getCurrentCompanyId();
  return new CrmRepository(supabase).completeActivity(companyId, activityId);
}

export async function convertLeadToCustomer(leadId: string) {
  const supabase = await createClient();
  const companyId = await getCurrentCompanyId();
  return new CrmRepository(supabase).convertLeadToCustomer(companyId, leadId);
}
