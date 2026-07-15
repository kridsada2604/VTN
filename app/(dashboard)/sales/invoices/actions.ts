"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createInvoice, postInvoicePaymentToAccounting, postInvoiceToAccounting, receiveInvoicePayment } from "@/lib/services/sales/invoice-service";
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

export async function postInvoiceAccountingAction(fd: FormData) {
  const invoiceId = String(fd.get("invoice_id") ?? "");
  if (!invoiceId) throw new Error("ไม่พบ Invoice");
  await postInvoiceToAccounting(invoiceId);
  revalidatePath(`/sales/invoices/${invoiceId}`);
  revalidatePath("/accounting");
  revalidatePath("/accounting/journal");
  redirect(`/sales/invoices/${invoiceId}`);
}

export async function postPaymentAccountingAction(fd: FormData) {
  const invoiceId = String(fd.get("invoice_id") ?? "");
  const paymentId = String(fd.get("payment_id") ?? "");
  if (!invoiceId || !paymentId) throw new Error("ไม่พบ Payment");
  await postInvoicePaymentToAccounting(paymentId);
  revalidatePath(`/sales/invoices/${invoiceId}`);
  revalidatePath("/accounting");
  revalidatePath("/accounting/journal");
  redirect(`/sales/invoices/${invoiceId}`);
}
