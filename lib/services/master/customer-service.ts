import { getCurrentCompanyId } from "@/lib/current-company";
import { CustomerRepository } from "@/lib/repositories/master/customer-repository";
import { createClient } from "@/lib/supabase/server";
import type { MasterPartyInput, ToggleMasterPartyInput } from "@/lib/validation/master/party";

export async function getCustomers(search = "") {
  const supabase = await createClient();
  const companyId = await getCurrentCompanyId();
  return new CustomerRepository(supabase).list(companyId, search);
}

export async function saveCustomer(input: MasterPartyInput) {
  const supabase = await createClient();
  const companyId = await getCurrentCompanyId();
  return new CustomerRepository(supabase).save(companyId, input);
}

export async function setCustomerActive(input: ToggleMasterPartyInput) {
  const supabase = await createClient();
  const companyId = await getCurrentCompanyId();
  return new CustomerRepository(supabase).setActive(companyId, input);
}
