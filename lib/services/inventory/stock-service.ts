import { getCurrentCompanyId } from "@/lib/current-company";
import { StockRepository } from "@/lib/repositories/inventory/stock-repository";
import { createClient } from "@/lib/supabase/server";
import type { CreateStockMovementInput, CreateStockTransferInput } from "@/lib/validation/inventory/stock-movement";

export async function getInventoryDashboard() {
  const supabase = await createClient();
  const companyId = await getCurrentCompanyId();
  return new StockRepository(supabase).getDashboard(companyId);
}

export async function getStockMovementFormOptions() {
  const supabase = await createClient();
  const companyId = await getCurrentCompanyId();
  return new StockRepository(supabase).getMovementFormOptions(companyId);
}

export async function createStockMovement(input: CreateStockMovementInput) {
  const supabase = await createClient();
  const companyId = await getCurrentCompanyId();
  return new StockRepository(supabase).createMovement(companyId, input);
}

export async function createStockTransfer(input: CreateStockTransferInput) {
  const supabase = await createClient();
  const companyId = await getCurrentCompanyId();
  return new StockRepository(supabase).createTransfer(companyId, input);
}

export async function getStockCard(productId?: string) {
  const supabase = await createClient();
  const companyId = await getCurrentCompanyId();
  return new StockRepository(supabase).getStockCard(companyId, productId);
}
