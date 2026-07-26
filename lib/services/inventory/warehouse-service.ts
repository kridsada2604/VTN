import { getCurrentCompanyId } from "@/lib/current-company";
import { WarehouseRepository } from "@/lib/repositories/inventory/warehouse-repository";
import { createClient } from "@/lib/supabase/server";
import type { SaveWarehouseInput, ToggleWarehouseInput } from "@/lib/validation/inventory/warehouse";

async function getRepository() {
  const supabase = await createClient();
  const companyId = await getCurrentCompanyId();
  return { companyId, repository: new WarehouseRepository(supabase) };
}

export async function getWarehouseMaster() {
  const { companyId, repository } = await getRepository();
  const [warehouses, branches] = await Promise.all([
    repository.list(companyId),
    repository.listActiveBranches(companyId),
  ]);

  return { warehouses, branches };
}

export async function saveWarehouseMaster(input: SaveWarehouseInput) {
  const { companyId, repository } = await getRepository();
  return repository.save(companyId, input);
}

export async function setWarehouseActive(input: ToggleWarehouseInput) {
  const { companyId, repository } = await getRepository();
  return repository.setActive(companyId, input);
}
