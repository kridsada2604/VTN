import type { createClient } from "@/lib/supabase/server";
import type { SaveInventoryMasterInput, ToggleInventoryMasterInput } from "@/lib/validation/inventory/master-record";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;
type InventoryMasterTable = "units" | "product_categories";

export type InventoryMasterRow = {
  id: string;
  code: string;
  name: string;
  is_active: boolean;
};

export class InventoryMasterRepository {
  constructor(
    private readonly supabase: SupabaseServerClient,
    private readonly table: InventoryMasterTable,
  ) {}

  async list(companyId: string) {
    const { data, error } = await this.supabase
      .from(this.table)
      .select("id,code,name,is_active")
      .eq("company_id", companyId)
      .order("code");

    if (error) throw error;
    return (data ?? []) as InventoryMasterRow[];
  }

  async save(companyId: string, input: SaveInventoryMasterInput) {
    const payload = {
      company_id: companyId,
      code: input.code,
      name: input.name,
    };

    const mutation = input.id
      ? this.supabase.from(this.table).update(payload).eq("id", input.id).eq("company_id", companyId)
      : this.supabase.from(this.table).insert(payload);

    const { error } = await mutation;
    if (error) throw error;
  }

  async setActive(companyId: string, input: ToggleInventoryMasterInput) {
    const { error } = await this.supabase
      .from(this.table)
      .update({ is_active: input.next })
      .eq("id", input.id)
      .eq("company_id", companyId);

    if (error) throw error;
  }
}
