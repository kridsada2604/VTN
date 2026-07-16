import { getCurrentCompanyId } from "@/lib/current-company";
import { ClaimRepository } from "@/lib/repositories/claims/claim-repository";
import { createClient } from "@/lib/supabase/server";
import type { CreateClaimInput, CreateClaimResolutionInput, CreateWarrantyPolicyInput, UpdateClaimStatusInput } from "@/lib/validation/claims/claim";

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

export async function getWarrantyPolicies() {
  const supabase = await createClient();
  const companyId = await getCurrentCompanyId();
  return new ClaimRepository(supabase).getWarrantyPolicies(companyId);
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

export async function updateClaimStatus(input: UpdateClaimStatusInput) {
  const supabase = await createClient();
  const companyId = await getCurrentCompanyId();
  return new ClaimRepository(supabase).updateStatus(companyId, input);
}

export async function createClaimResolution(input: CreateClaimResolutionInput) {
  const supabase = await createClient();
  const companyId = await getCurrentCompanyId();
  return new ClaimRepository(supabase).createResolution(companyId, input);
}

export async function createWarrantyPolicy(input: CreateWarrantyPolicyInput) {
  const supabase = await createClient();
  const companyId = await getCurrentCompanyId();
  return new ClaimRepository(supabase).createWarrantyPolicy(companyId, input);
}
