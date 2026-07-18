import { getCurrentCompanyId } from "@/lib/current-company";
import { BranchRepository } from "@/lib/repositories/core/branch-repository";
import { createClient } from "@/lib/supabase/server";

export async function getBranches() {
  const supabase = await createClient();
  const companyId = await getCurrentCompanyId();
  return new BranchRepository(supabase).list(companyId);
}
