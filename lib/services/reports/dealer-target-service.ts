import { getCurrentCompanyId } from "@/lib/current-company";
import { DealerTargetRepository } from "@/lib/repositories/reports/dealer-target-repository";
import { createClient } from "@/lib/supabase/server";
import type { DealerTargetFilters } from "@/lib/repositories/reports/dealer-target-repository";
import type { UpsertDealerTargetInput } from "@/lib/validation/reports/dealer-target";

export async function getDealerTargetDashboard(filters: DealerTargetFilters) {
  const supabase = await createClient();
  const companyId = await getCurrentCompanyId();
  return new DealerTargetRepository(supabase).dashboard(companyId, filters);
}

export async function upsertDealerTarget(input: UpsertDealerTargetInput) {
  const supabase = await createClient();
  const companyId = await getCurrentCompanyId();
  return new DealerTargetRepository(supabase).upsertTarget(companyId, input);
}
