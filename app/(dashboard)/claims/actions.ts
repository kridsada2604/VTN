"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClaim, updateClaimStatus } from "@/lib/services/claims/claim-service";
import { parseClaimForm, parseClaimStatusForm } from "@/lib/validation/claims/claim";

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
