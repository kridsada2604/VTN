"use server";

import { revalidatePath } from "next/cache";
import { updateRolePermission } from "@/lib/services/system/permission-service";
import { parseUpdateRolePermissionForm } from "@/lib/validation/system/permission";

export async function saveRolePermission(formData: FormData) {
  await updateRolePermission(parseUpdateRolePermissionForm(formData));
  revalidatePath("/users/permissions");
}
