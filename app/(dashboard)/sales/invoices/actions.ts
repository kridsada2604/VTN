"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createInvoice, receiveInvoicePayment } from "@/lib/services/sales/invoice-service";
import { parseInvoiceForm, parseReceivePaymentForm } from "@/lib/validation/sales/invoice";

export async function saveInvoice(fd: FormData) {
  const invoiceId = await createInvoice(parseInvoiceForm(fd));
  revalidatePath("/sales");
  revalidatePath("/sales/invoices");
  redirect(`/sales/invoices/${invoiceId}`);
}

export async function receivePayment(fd: FormData) {
  const input = parseReceivePaymentForm(fd);
  await receiveInvoicePayment(input);
  revalidatePath("/sales");
  revalidatePath("/sales/invoices");
  revalidatePath(`/sales/invoices/${input.invoice_id}`);
}
