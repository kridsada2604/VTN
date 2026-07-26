"use server";

import { revalidatePath } from "next/cache";
import { updateUserMembership } from "@/lib/services/system/user-service";
import { parseUpdateUserMembershipForm } from "@/lib/validation/system/user";

export async function saveUserMembership(formData: FormData) {
  await updateUserMembership(parseUpdateUserMembershipForm(formData));
  revalidatePath("/users");
}
