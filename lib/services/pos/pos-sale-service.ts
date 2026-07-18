import { getCurrentCompanyId } from "@/lib/current-company";
import { CompanyRepository } from "@/lib/repositories/core/company-repository";
import { PosSaleRepository } from "@/lib/repositories/pos/pos-sale-repository";
import { createClient } from "@/lib/supabase/server";
import type { ClosePosSessionInput, CreatePosSaleInput, OpenPosSessionInput, PosSaleAdjustmentInput } from "@/lib/validation/pos/pos-sale";

export async function getPosSales() {
  const supabase = await createClient();
  const companyId = await getCurrentCompanyId();
  return new PosSaleRepository(supabase).list(companyId);
}

export async function getPosSaleFormOptions() {
  const supabase = await createClient();
  const companyId = await getCurrentCompanyId();
  return new PosSaleRepository(supabase).getFormOptions(companyId);
}

export async function getPosSaleDetail(saleId: string) {
  const supabase = await createClient();
  const companyId = await getCurrentCompanyId();
  return new PosSaleRepository(supabase).getById(companyId, saleId);
}

export async function createPosSale(input: CreatePosSaleInput) {
  const supabase = await createClient();
  const companyId = await getCurrentCompanyId();
  const taxDefaults = await new CompanyRepository(supabase).getTaxDefaults(companyId);
  const normalizedInput = taxDefaults.is_vat_registered
    ? input
    : { ...input, items: input.items.map((item) => ({ ...item, line_tax: 0 })) };
  return new PosSaleRepository(supabase).create(companyId, normalizedInput);
}

export async function openPosSession(input: OpenPosSessionInput) {
  const supabase = await createClient();
  const companyId = await getCurrentCompanyId();
  return new PosSaleRepository(supabase).openSession(companyId, input);
}

export async function closePosSession(input: ClosePosSessionInput) {
  const supabase = await createClient();
  const companyId = await getCurrentCompanyId();
  return new PosSaleRepository(supabase).closeSession(companyId, input);
}

export async function voidPosSale(input: PosSaleAdjustmentInput) {
  const supabase = await createClient();
  const companyId = await getCurrentCompanyId();
  return new PosSaleRepository(supabase).voidSale(companyId, input);
}

export async function refundPosSale(input: PosSaleAdjustmentInput) {
  const supabase = await createClient();
  const companyId = await getCurrentCompanyId();
  return new PosSaleRepository(supabase).refundSale(companyId, input);
}
