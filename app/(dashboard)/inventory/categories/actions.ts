"use server";

import { revalidatePath } from "next/cache";
import { saveInventoryMaster, setInventoryMasterActive } from "@/lib/services/inventory/inventory-master-service";
import { parseInventoryMasterForm, parseToggleInventoryMasterForm } from "@/lib/validation/inventory/master-record";

export async function saveCategory(formData: FormData) {
  await saveInventoryMaster("category", parseInventoryMasterForm(formData, "Product category"));
  revalidatePath("/inventory/categories");
}

export async function toggleCategory(formData: FormData) {
  await setInventoryMasterActive("category", parseToggleInventoryMasterForm(formData, "Product category"));
  revalidatePath("/inventory/categories");
}
