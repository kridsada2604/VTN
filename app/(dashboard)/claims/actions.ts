"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClaim, createClaimResolution, createWarrantyPolicy, updateClaimStatus } from "@/lib/services/claims/claim-service";
import { parseClaimForm, parseClaimResolutionForm, parseClaimStatusForm, parseWarrantyPolicyForm } from "@/lib/validation/claims/claim";

export async function saveClaim(fd: FormData) {
  const id = await createClaim(parseClaimForm(fd));
  revalidatePath("/claims");
  redirect(`/claims/${id}`);
}

export async function updateClaimStatusAction(fd: FormData) {
  const input = parseClaimStatusForm(fd);
  await updateClaimStatus(input);
  revalidatePath("/claims");
  revalidatePath(`/claims/${input.claim_id}`);
  redirect(`/claims/${input.claim_id}`);
}

export async function createClaimResolutionAction(fd: FormData) {
  const input = parseClaimResolutionForm(fd);
  await createClaimResolution(input);
  revalidatePath("/claims");
  revalidatePath(`/claims/${input.claim_id}`);
  revalidatePath("/inventory");
  revalidatePath("/inventory/stock-card");
  redirect(`/claims/${input.claim_id}`);
}

export async function saveWarrantyPolicy(fd: FormData) {
  await createWarrantyPolicy(parseWarrantyPolicyForm(fd));
  revalidatePath("/claims");
  revalidatePath("/claims/warranty");
  redirect("/claims/warranty");
}
