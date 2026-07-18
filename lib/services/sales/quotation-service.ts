import { getCurrentCompanyId } from "@/lib/current-company";
import { QuotationRepository } from "@/lib/repositories/sales/quotation-repository";
import { createClient } from "@/lib/supabase/server";
import type { CreateQuotationInput, UpdateQuotationStatusInput } from "@/lib/validation/sales/quotation";
import { buildQuotationInstallments, computeQuotationItems } from "./quotation-calculator";

export async function getQuotations() {
  const supabase = await createClient();
  const companyId = await getCurrentCompanyId();
  return new QuotationRepository(supabase).list(companyId);
}

export async function getQuotationFormOptions() {
  const supabase = await createClient();
  const companyId = await getCurrentCompanyId();
  return new QuotationRepository(supabase).getFormOptions(companyId);
}

export async function getQuotationDetail(quotationId: string) {
  const supabase = await createClient();
  const companyId = await getCurrentCompanyId();
  return new QuotationRepository(supabase).getById(companyId, quotationId);
}

export async function createQuotation(input: CreateQuotationInput) {
  const supabase = await createClient();
  const companyId = await getCurrentCompanyId();
  const { data: { user } } = await supabase.auth.getUser();
  const { computedItems, totals } = computeQuotationItems(input.items, input.is_vat_registered, input.withholding_tax_rate);
  const installments = buildQuotationInstallments(totals.net_payable_amount, input.installment_count, input.quotation_date);
  return new QuotationRepository(supabase).create(companyId, input, computedItems, totals, installments, user?.id);
}

export async function updateQuotationStatus(input: UpdateQuotationStatusInput) {
  const supabase = await createClient();
  const companyId = await getCurrentCompanyId();
  const { data: { user } } = await supabase.auth.getUser();
  return new QuotationRepository(supabase).updateStatus(companyId, input, user?.id);
}
