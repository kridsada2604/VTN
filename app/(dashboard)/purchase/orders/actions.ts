"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createPurchaseOrder, payPurchaseOrder, postPurchaseOrderToAccounting, receivePurchaseOrder } from "@/lib/services/purchase/purchase-order-service";
import { parsePayPurchaseOrderForm, parsePurchaseOrderForm, parseReceivePurchaseOrderForm } from "@/lib/validation/purchase/purchase-order";

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

export async function postPurchaseOrderAccountingAction(fd: FormData) {
  const purchaseOrderId = String(fd.get("purchase_order_id") ?? "");
  await postPurchaseOrderToAccounting(purchaseOrderId);
  revalidatePath("/purchase/orders");
  revalidatePath(`/purchase/orders/${purchaseOrderId}`);
  revalidatePath("/accounting");
  revalidatePath("/accounting/journal");
  redirect(`/purchase/orders/${purchaseOrderId}`);
}

export async function payPurchaseOrderAction(fd: FormData) {
  const input = parsePayPurchaseOrderForm(fd);
  await payPurchaseOrder(input);
  revalidatePath("/purchase/orders");
  revalidatePath(`/purchase/orders/${input.purchase_order_id}`);
  revalidatePath("/accounting");
  revalidatePath("/accounting/journal");
  redirect(`/purchase/orders/${input.purchase_order_id}`);
}
