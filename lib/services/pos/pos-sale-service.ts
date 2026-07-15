import { getCurrentCompanyId } from "@/lib/current-company";
import { PosSaleRepository } from "@/lib/repositories/pos/pos-sale-repository";
import { createClient } from "@/lib/supabase/server";
import type { CreatePosSaleInput } from "@/lib/validation/pos/pos-sale";

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
