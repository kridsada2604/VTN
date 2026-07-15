import { getCurrentCompanyId } from "@/lib/current-company";
import { ClaimRepository } from "@/lib/repositories/claims/claim-repository";
import { createClient } from "@/lib/supabase/server";
import type { CreateClaimInput } from "@/lib/validation/claims/claim";

export async function getClaims() {
  const supabase = await createClient();
  const companyId = await getCurrentCompanyId();
  return new ClaimRepository(supabase).list(companyId);
}

export async function getClaimFormOptions() {
  const supabase = await createClient();
  const companyId = await getCurrentCompanyId();
  return new ClaimRepository(supabase).getFormOptions(companyId);
}

export async function getClaimDetail(claimId: string) {
  const supabase = await createClient();
  const companyId = await getCurrentCompanyId();
  return new ClaimRepository(supabase).getById(companyId, claimId);
}

export async function createClaim(input: CreateClaimInput) {
  const supabase = await createClient();
  const companyId = await getCurrentCompanyId();
  return new ClaimRepository(supabase).create(companyId, input);
}
