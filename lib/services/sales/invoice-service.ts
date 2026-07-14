import { createClient } from "@/lib/supabase/server";
import { getCurrentCompanyId } from "@/lib/current-company";
import { InvoiceRepository } from "@/lib/repositories/sales/invoice-repository";
import { computeInvoiceItems } from "./invoice-calculator";
import type { CreateInvoiceInput, ReceivePaymentInput } from "@/lib/validation/sales/invoice";

export async function getInvoiceList() {
  const supabase = await createClient();
  const companyId = await getCurrentCompanyId();
  return new InvoiceRepository(supabase).list(companyId);
}

export async function getInvoiceFormOptions() {
  const supabase = await createClient();
  const companyId = await getCurrentCompanyId();
  return new InvoiceRepository(supabase).getFormOptions(companyId);
}

export async function getInvoiceDetail(invoiceId: string) {
  const supabase = await createClient();
  const companyId = await getCurrentCompanyId();
  return new InvoiceRepository(supabase).getById(companyId, invoiceId);
}

export async function createInvoice(input: CreateInvoiceInput) {
  const supabase = await createClient();
  const companyId = await getCurrentCompanyId();
  const { computedItems, totals } = computeInvoiceItems(input.items);
  return new InvoiceRepository(supabase).create(companyId, input, computedItems, totals);
}

export async function receiveInvoicePayment(input: ReceivePaymentInput) {
  const supabase = await createClient();
  const companyId = await getCurrentCompanyId();
  return new InvoiceRepository(supabase).receivePayment(companyId, input);
}
