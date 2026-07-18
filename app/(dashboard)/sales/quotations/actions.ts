"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createQuotation, updateQuotationStatus as updateQuotationStatusService } from "@/lib/services/sales/quotation-service";
import { createSalesOrderFromQuotation } from "@/lib/services/sales/sales-order-service";
import { parseQuotationForm, parseQuotationStatusForm } from "@/lib/validation/sales/quotation";
import { parseQuotationToSalesOrderForm } from "@/lib/validation/sales/sales-order";

export async function saveQuotation(fd: FormData) {
  const quotationId = await createQuotation(parseQuotationForm(fd));
  revalidatePath("/sales");
  revalidatePath("/sales/quotations");
  redirect(`/sales/quotations/${quotationId}`);
}

export async function updateQuotationStatus(fd: FormData) {
  const input = parseQuotationStatusForm(fd);
  await updateQuotationStatusService(input);
  revalidatePath(`/sales/quotations/${input.quotation_id}`);
  revalidatePath("/sales/quotations");
  revalidatePath("/sales");
}

export async function convertQuotationToSalesOrder(fd: FormData) {
  const salesOrderId = await createSalesOrderFromQuotation(parseQuotationToSalesOrderForm(fd));
  revalidatePath("/sales");
  revalidatePath("/sales/quotations");
  revalidatePath("/sales/orders");
  redirect(`/sales/orders/${salesOrderId}`);
}
