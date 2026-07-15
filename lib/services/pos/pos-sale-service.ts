import { getCurrentCompanyId } from "@/lib/current-company";
import { PosSaleRepository } from "@/lib/repositories/pos/pos-sale-repository";
import { createClient } from "@/lib/supabase/server";
import type { ClosePosSessionInput, CreatePosSaleInput, OpenPosSessionInput } from "@/lib/validation/pos/pos-sale";

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
  return new PosSaleRepository(supabase).create(companyId, input);
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
