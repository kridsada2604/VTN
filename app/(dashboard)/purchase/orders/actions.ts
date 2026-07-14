"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createPurchaseOrder, receivePurchaseOrder } from "@/lib/services/purchase/purchase-order-service";
import { parsePurchaseOrderForm, parseReceivePurchaseOrderForm } from "@/lib/validation/purchase/purchase-order";

export async function savePurchaseOrder(fd: FormData) {
  const id = await createPurchaseOrder(parsePurchaseOrderForm(fd));
  revalidatePath("/purchase/orders");
  redirect(`/purchase/orders/${id}`);
}

export async function receivePurchaseOrderAction(fd: FormData) {
  const input = parseReceivePurchaseOrderForm(fd);
  await receivePurchaseOrder(input);
  revalidatePath("/purchase/orders");
  revalidatePath(`/purchase/orders/${input.purchase_order_id}`);
  revalidatePath("/inventory");
  revalidatePath("/inventory/stock-card");
  redirect(`/purchase/orders/${input.purchase_order_id}`);
}
