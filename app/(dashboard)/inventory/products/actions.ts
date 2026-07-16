"use server";

import { revalidatePath } from "next/cache";
import { saveProductMaster, setProductActive } from "@/lib/services/inventory/product-service";
import { parseProductForm, parseToggleProductForm } from "@/lib/validation/inventory/product";

export async function saveProduct(fd: FormData) {
  await saveProductMaster(parseProductForm(fd));
  revalidatePath("/inventory/products");
}

export async function toggleProduct(fd: FormData) {
  await setProductActive(parseToggleProductForm(fd));
  revalidatePath("/inventory/products");
}
