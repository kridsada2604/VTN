"use server";

import { revalidatePath } from "next/cache";
import { saveWarehouseMaster, setWarehouseActive } from "@/lib/services/inventory/warehouse-service";
import { parseToggleWarehouseForm, parseWarehouseForm } from "@/lib/validation/inventory/warehouse";

export async function saveWarehouse(formData: FormData) {
  await saveWarehouseMaster(parseWarehouseForm(formData));
  revalidatePath("/inventory/warehouses");
}

export async function toggleWarehouse(formData: FormData) {
  await setWarehouseActive(parseToggleWarehouseForm(formData));
  revalidatePath("/inventory/warehouses");
}
