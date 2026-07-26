"use server";

import { revalidatePath } from "next/cache";
import { saveInventoryMaster, setInventoryMasterActive } from "@/lib/services/inventory/inventory-master-service";
import { parseInventoryMasterForm, parseToggleInventoryMasterForm } from "@/lib/validation/inventory/master-record";

export async function saveUnit(formData: FormData) {
  await saveInventoryMaster("unit", parseInventoryMasterForm(formData, "Unit"));
  revalidatePath("/inventory/units");
}

export async function toggleUnit(formData: FormData) {
  await setInventoryMasterActive("unit", parseToggleInventoryMasterForm(formData, "Unit"));
  revalidatePath("/inventory/units");
}
