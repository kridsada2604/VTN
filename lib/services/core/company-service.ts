import { getCurrentCompanyId } from "@/lib/current-company";
import { CompanyRepository } from "@/lib/repositories/core/company-repository";
import { createClient } from "@/lib/supabase/server";
import type { UpdateCompanyTaxProfileInput } from "@/lib/validation/core/company-tax";

export async function getCompanyProfile() {
  const supabase = await createClient();
  const companyId = await getCurrentCompanyId();
  return new CompanyRepository(supabase).getProfile(companyId);
}

export async function getCompanyTaxDefaults() {
  const supabase = await createClient();
  const companyId = await getCurrentCompanyId();
  return new CompanyRepository(supabase).getTaxDefaults(companyId);
}

export async function updateCompanyTaxProfile(input: UpdateCompanyTaxProfileInput) {
  const supabase = await createClient();
  const companyId = await getCurrentCompanyId();
  return new CompanyRepository(supabase).updateTaxProfile(companyId, input);
}