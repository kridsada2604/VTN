import { getCurrentCompanyId } from "@/lib/current-company";
import { InventoryMasterRepository } from "@/lib/repositories/inventory/inventory-master-repository";
import { createClient } from "@/lib/supabase/server";
import type { SaveInventoryMasterInput, ToggleInventoryMasterInput } from "@/lib/validation/inventory/master-record";

type InventoryMasterKind = "unit" | "category";

const tableByKind = {
  unit: "units",
  category: "product_categories",
} as const;

async function getRepository(kind: InventoryMasterKind) {
  const supabase = await createClient();
  const companyId = await getCurrentCompanyId();
  return { companyId, repository: new InventoryMasterRepository(supabase, tableByKind[kind]) };
}

export async function getInventoryMasterRows(kind: InventoryMasterKind) {
  const { companyId, repository } = await getRepository(kind);
  return repository.list(companyId);
}

export async function saveInventoryMaster(kind: InventoryMasterKind, input: SaveInventoryMasterInput) {
  const { companyId, repository } = await getRepository(kind);
  return repository.save(companyId, input);
}

export async function setInventoryMasterActive(kind: InventoryMasterKind, input: ToggleInventoryMasterInput) {
  const { companyId, repository } = await getRepository(kind);
  return repository.setActive(companyId, input);
}
