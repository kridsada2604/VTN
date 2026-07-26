import type { createClient } from "@/lib/supabase/server";
import type { MasterPartyInput, ToggleMasterPartyInput } from "@/lib/validation/master/party";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export type SupplierRow = {
  id: string;
  code: string;
  name: string;
  tax_id: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  is_active: boolean;
};

export class SupplierRepository {
  constructor(private readonly supabase: SupabaseServerClient) {}

  async list(companyId: string, search: string) {
    let query = this.supabase.from("suppliers").select("id,code,name,tax_id,phone,email,address,is_active").eq("company_id", companyId).order("code");
    if (search) query = query.or(`code.ilike.%${search}%,name.ilike.%${search}%,phone.ilike.%${search}%`);
    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as SupplierRow[];
  }

  async save(companyId: string, input: MasterPartyInput) {
    const payload = { company_id: companyId, code: input.code, name: input.name, tax_id: input.tax_id, phone: input.phone, email: input.email, address: input.address };
    const result = input.id
      ? await this.supabase.from("suppliers").update(payload).eq("id", input.id).eq("company_id", companyId)
      : await this.supabase.from("suppliers").insert(payload);
    if (result.error) throw result.error;
  }

  async setActive(companyId: string, input: ToggleMasterPartyInput) {
    const { error } = await this.supabase.from("suppliers").update({ is_active: input.is_active }).eq("id", input.id).eq("company_id", companyId);
    if (error) throw error;
  }
}
