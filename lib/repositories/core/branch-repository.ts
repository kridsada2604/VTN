import type { createClient } from "@/lib/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export type BranchRow = {
  id: string;
  code: string;
  name: string;
  branch_number: string | null;
  is_active: boolean;
};

export class BranchRepository {
  constructor(private readonly supabase: SupabaseServerClient) {}

  async list(companyId: string) {
    const { data, error } = await this.supabase
      .from("branches")
      .select("id,code,name,branch_number,is_active")
      .eq("company_id", companyId)
      .order("code");

    if (error) throw error;
    return (data ?? []) as BranchRow[];
  }
}
