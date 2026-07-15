import { getCurrentCompanyId } from "@/lib/current-company";
import { SalesOrderRepository } from "@/lib/repositories/sales/sales-order-repository";
import { createClient } from "@/lib/supabase/server";
import type { CreateSalesOrderInput, DeliverSalesOrderInput, ReserveSalesOrderInput } from "@/lib/validation/sales/sales-order";
import { computeSalesOrderItems } from "./sales-order-calculator";

export async function getSalesOrders() {
  const supabase = await createClient();
  const companyId = await getCurrentCompanyId();
  return new SalesOrderRepository(supabase).list(companyId);
}

export async function getSalesOrderFormOptions() {
  const supabase = await createClient();
  const companyId = await getCurrentCompanyId();
  return new SalesOrderRepository(supabase).getFormOptions(companyId);
}

export async function getSalesOrderDetail(salesOrderId: string) {
  const supabase = await createClient();
  const companyId = await getCurrentCompanyId();
  return new SalesOrderRepository(supabase).getById(companyId, salesOrderId);
}

export async function createSalesOrder(input: CreateSalesOrderInput) {
  const supabase = await createClient();
  const companyId = await getCurrentCompanyId();
  const { computedItems } = computeSalesOrderItems(input.items);
  return new SalesOrderRepository(supabase).create(companyId, input, computedItems);
}

export async function reserveSalesOrder(input: ReserveSalesOrderInput) {
  const supabase = await createClient();
  const companyId = await getCurrentCompanyId();
  return new SalesOrderRepository(supabase).reserve(companyId, input);
}

export async function deliverSalesOrder(input: DeliverSalesOrderInput) {
  const supabase = await createClient();
  const companyId = await getCurrentCompanyId();
  return new SalesOrderRepository(supabase).deliver(companyId, input);
}
