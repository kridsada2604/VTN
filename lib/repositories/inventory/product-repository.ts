import type { createClient } from "@/lib/supabase/server";
import type { SaveProductInput, ToggleProductInput } from "@/lib/validation/inventory/product";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export type ProductRow = {
  id: string;
  sku: string;
  name: string;
  barcode: string | null;
  cost_price: number | string;
  selling_price: number | string;
  is_active: boolean;
  category_id: string | null;
  unit_id: string | null;
  product_categories: { name: string }[] | null;
  units: { name: string }[] | null;
};

export class ProductRepository {
  constructor(private readonly supabase: SupabaseServerClient) {}

  async list(companyId: string, q: string) {
    let query = this.supabase
      .from("products")
      .select("id,sku,name,barcode,cost_price,selling_price,is_active,category_id,unit_id,product_categories(name),units(name)")
      .eq("company_id", companyId)
      .order("name");

    if (q) query = query.or(`sku.ilike.%${q}%,name.ilike.%${q}%,barcode.ilike.%${q}%`);

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as ProductRow[];
  }

  async getFormOptions(companyId: string) {
    const [categories, units] = await Promise.all([
      this.supabase.from("product_categories").select("id,name").eq("company_id", companyId).eq("is_active", true).order("name"),
      this.supabase.from("units").select("id,name").eq("company_id", companyId).eq("is_active", true).order("name"),
    ]);

    if (categories.error) throw categories.error;
    if (units.error) throw units.error;

    return { categories: categories.data ?? [], units: units.data ?? [] };
  }

  async save(companyId: string, input: SaveProductInput) {
    const { data, error } = await this.supabase.rpc("upsert_product_master", {
      p_company_id: companyId,
      p_product_id: input.id,
      p_sku: input.sku,
      p_name: input.name,
      p_barcode: input.barcode,
      p_category_id: input.category_id,
      p_unit_id: input.unit_id,
      p_cost_price: input.cost_price,
      p_selling_price: input.selling_price,
    });

    if (error) throw error;
    return String(data);
  }

  async setActive(companyId: string, input: ToggleProductInput) {
    const { data, error } = await this.supabase.rpc("set_product_active", {
      p_company_id: companyId,
      p_product_id: input.id,
      p_is_active: input.next,
    });

    if (error) throw error;
    return String(data);
  }
}
