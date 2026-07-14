import { getCurrentCompanyId } from "@/lib/current-company";
import { PurchaseOrderRepository } from "@/lib/repositories/purchase/purchase-order-repository";
import { createClient } from "@/lib/supabase/server";
import type { CreatePurchaseOrderInput, ReceivePurchaseOrderInput } from "@/lib/validation/purchase/purchase-order";
import { computePurchaseOrderItems } from "./purchase-order-calculator";

export async function getPurchaseOrders() {
  const supabase = await createClient();
  const companyId = await getCurrentCompanyId();
  return new PurchaseOrderRepository(supabase).list(companyId);
}

export async function getPurchaseOrderFormOptions() {
  const supabase = await createClient();
  const companyId = await getCurrentCompanyId();
  return new PurchaseOrderRepository(supabase).getFormOptions(companyId);
}

export async function getPurchaseOrderDetail(purchaseOrderId: string) {
  const supabase = await createClient();
  const companyId = await getCurrentCompanyId();
  return new PurchaseOrderRepository(supabase).getById(companyId, purchaseOrderId);
}

export async function createPurchaseOrder(input: CreatePurchaseOrderInput) {
  const supabase = await createClient();
  const companyId = await getCurrentCompanyId();
  const { computedItems, totals } = computePurchaseOrderItems(input.items);
  return new PurchaseOrderRepository(supabase).create(companyId, input, computedItems, totals);
}

export async function getPurchaseReceiveOptions(purchaseOrderId: string) {
  const supabase = await createClient();
  const companyId = await getCurrentCompanyId();
  return new PurchaseOrderRepository(supabase).getReceiveOptions(companyId, purchaseOrderId);
}

export async function receivePurchaseOrder(input: ReceivePurchaseOrderInput) {
  const supabase = await createClient();
  const companyId = await getCurrentCompanyId();
  return new PurchaseOrderRepository(supabase).receive(companyId, input);
}
