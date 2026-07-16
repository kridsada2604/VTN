import { getCurrentCompanyId } from "@/lib/current-company";
import { ProductRepository } from "@/lib/repositories/inventory/product-repository";
import { createClient } from "@/lib/supabase/server";
import type { SaveProductInput, ToggleProductInput } from "@/lib/validation/inventory/product";

export async function getProductMaster(q: string) {
  const supabase = await createClient();
  const companyId = await getCurrentCompanyId();
  const repository = new ProductRepository(supabase);
  const [products, options] = await Promise.all([
    repository.list(companyId, q),
    repository.getFormOptions(companyId),
  ]);

  return { products, ...options };
}

export async function saveProductMaster(input: SaveProductInput) {
  const supabase = await createClient();
  const companyId = await getCurrentCompanyId();
  return new ProductRepository(supabase).save(companyId, input);
}

export async function setProductActive(input: ToggleProductInput) {
  const supabase = await createClient();
  const companyId = await getCurrentCompanyId();
  return new ProductRepository(supabase).setActive(companyId, input);
}
