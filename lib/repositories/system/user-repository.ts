import type { createClient } from "@/lib/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export type UserMembershipRow = {
  id: string;
  user_id: string;
  branch_id: string | null;
  created_at: string;
  profiles: { full_name: string | null; email: string | null; is_active: boolean; created_at: string }[] | null;
  roles: { code: string; name: string; description: string | null }[] | null;
  branches: { code: string; name: string }[] | null;
};

export class UserRepository {
  constructor(private readonly supabase: SupabaseServerClient) {}

  async listCompanyUsers(companyId: string) {
    const { data, error } = await this.supabase
      .from("company_memberships")
      .select("id,user_id,branch_id,created_at,profiles(full_name,email,is_active,created_at),roles(code,name,description),branches(code,name)")
      .eq("company_id", companyId)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return (data ?? []) as UserMembershipRow[];
  }
}
