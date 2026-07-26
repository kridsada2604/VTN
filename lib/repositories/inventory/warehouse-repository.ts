import type { createClient } from "@/lib/supabase/server";
import type { SaveWarehouseInput, ToggleWarehouseInput } from "@/lib/validation/inventory/warehouse";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export type WarehouseRow = {
  id: string;
  code: string;
  name: string;
  is_active: boolean;
  branch_id: string;
  branches: { name: string }[] | null;
};

export type WarehouseBranchOption = {
  id: string;
  name: string;
};

export class WarehouseRepository {
  constructor(private readonly supabase: SupabaseServerClient) {}

  async list(companyId: string) {
    const { data, error } = await this.supabase
      .from("warehouses")
      .select("id,code,name,is_active,branch_id,branches(name)")
      .eq("company_id", companyId)
      .order("code");

    if (error) throw error;
    return (data ?? []) as WarehouseRow[];
  }

  async listActiveBranches(companyId: string) {
    const { data, error } = await this.supabase
      .from("branches")
      .select("id,name")
      .eq("company_id", companyId)
      .eq("is_active", true)
      .order("name");

    if (error) throw error;
    return (data ?? []) as WarehouseBranchOption[];
  }

  async save(companyId: string, input: SaveWarehouseInput) {
    const payload = {
      company_id: companyId,
      branch_id: input.branch_id,
      code: input.code,
      name: input.name,
    };

    const mutation = input.id
      ? this.supabase.from("warehouses").update(payload).eq("id", input.id).eq("company_id", companyId)
      : this.supabase.from("warehouses").insert(payload);

    const { error } = await mutation;
    if (error) throw error;
  }

  async setActive(companyId: string, input: ToggleWarehouseInput) {
    const { error } = await this.supabase
      .from("warehouses")
      .update({ is_active: input.next })
      .eq("id", input.id)
      .eq("company_id", companyId);

    if (error) throw error;
  }
}
