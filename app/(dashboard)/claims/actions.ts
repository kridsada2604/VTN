"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClaim } from "@/lib/services/claims/claim-service";
import { parseClaimForm } from "@/lib/validation/claims/claim";

export async function saveClaim(fd: FormData) {
  const id = await createClaim(parseClaimForm(fd));
  revalidatePath("/claims");
  redirect(`/claims/${id}`);
}
