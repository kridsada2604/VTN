"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createPurchaseOrder } from "@/lib/services/purchase/purchase-order-service";
import { parsePurchaseOrderForm } from "@/lib/validation/purchase/purchase-order";

export async function savePurchaseOrder(fd: FormData) {
  const id = await createPurchaseOrder(parsePurchaseOrderForm(fd));
  revalidatePath("/purchase/orders");
  redirect(`/purchase/orders/${id}`);
}
