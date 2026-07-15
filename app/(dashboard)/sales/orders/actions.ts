"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSalesOrder, deliverSalesOrder, reserveSalesOrder } from "@/lib/services/sales/sales-order-service";
import { parseDeliverSalesOrderForm, parseReserveSalesOrderForm, parseSalesOrderForm } from "@/lib/validation/sales/sales-order";

export async function saveSalesOrder(fd: FormData) {
  const id = await createSalesOrder(parseSalesOrderForm(fd));
  revalidatePath("/sales");
  revalidatePath("/sales/orders");
  redirect(`/sales/orders/${id}`);
}

export async function reserveSalesOrderAction(fd: FormData) {
  const input = parseReserveSalesOrderForm(fd);
  await reserveSalesOrder(input);
  revalidatePath("/sales/orders");
  revalidatePath(`/sales/orders/${input.sales_order_id}`);
  revalidatePath("/inventory");
  redirect(`/sales/orders/${input.sales_order_id}`);
}

export async function deliverSalesOrderAction(fd: FormData) {
  const input = parseDeliverSalesOrderForm(fd);
  await deliverSalesOrder(input);
  revalidatePath("/sales/orders");
  revalidatePath(`/sales/orders/${input.sales_order_id}`);
  revalidatePath("/inventory");
  revalidatePath("/inventory/stock-card");
  redirect(`/sales/orders/${input.sales_order_id}`);
}
