import { getCurrentCompanyId } from "@/lib/current-company";
import { UserRepository } from "@/lib/repositories/system/user-repository";
import { createClient } from "@/lib/supabase/server";

export async function getCompanyUsers() {
  const supabase = await createClient();
  const companyId = await getCurrentCompanyId();
  return new UserRepository(supabase).listCompanyUsers(companyId);
}
