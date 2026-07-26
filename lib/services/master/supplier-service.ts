import { getCurrentCompanyId } from "@/lib/current-company";
import { SupplierRepository } from "@/lib/repositories/master/supplier-repository";
import { createClient } from "@/lib/supabase/server";
import type { MasterPartyInput, ToggleMasterPartyInput } from "@/lib/validation/master/party";

export async function getSuppliers(search = "") {
  const supabase = await createClient();
  const companyId = await getCurrentCompanyId();
  return new SupplierRepository(supabase).list(companyId, search);
}

export async function saveSupplier(input: MasterPartyInput) {
  const supabase = await createClient();
  const companyId = await getCurrentCompanyId();
  return new SupplierRepository(supabase).save(companyId, input);
}

export async function setSupplierActive(input: ToggleMasterPartyInput) {
  const supabase = await createClient();
  const companyId = await getCurrentCompanyId();
  return new SupplierRepository(supabase).setActive(companyId, input);
}
