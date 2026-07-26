import type { createClient } from "@/lib/supabase/server";
import type { UpdateUserMembershipInput } from "@/lib/validation/system/user";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export type UserMembershipRow = {
  id: string;
  user_id: string;
  role_id: string;
  branch_id: string | null;
  created_at: string;
  profiles: { full_name: string | null; email: string | null; is_active: boolean; created_at: string }[] | null;
  roles: { code: string; name: string; description: string | null }[] | null;
  branches: { code: string; name: string }[] | null;
};

export type RoleOption = {
  id: string;
  code: string;
  name: string;
  description: string | null;
};

export type UserBranchOption = {
  id: string;
  code: string;
  name: string;
  is_active: boolean;
};

export class UserRepository {
  constructor(private readonly supabase: SupabaseServerClient) {}

  async listCompanyUsers(companyId: string) {
    const { data, error } = await this.supabase
      .from("company_memberships")
      .select("id,user_id,role_id,branch_id,created_at,profiles(full_name,email,is_active,created_at),roles(code,name,description),branches(code,name)")
      .eq("company_id", companyId)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return (data ?? []) as UserMembershipRow[];
  }

  async listRoles() {
    const { data, error } = await this.supabase
      .from("roles")
      .select("id,code,name,description")
      .order("code");

    if (error) throw error;
    return (data ?? []) as RoleOption[];
  }

  async listBranches(companyId: string) {
    const { data, error } = await this.supabase
      .from("branches")
      .select("id,code,name,is_active")
      .eq("company_id", companyId)
      .order("code");

    if (error) throw error;
    return (data ?? []) as UserBranchOption[];
  }

  async updateMembership(companyId: string, input: UpdateUserMembershipInput) {
    const { data, error } = await this.supabase.rpc("update_company_user_membership", {
      p_company_id: companyId,
      p_membership_id: input.membership_id,
      p_role_id: input.role_id,
      p_branch_id: input.branch_id,
      p_is_active: input.is_active,
    });

    if (error) throw error;
    return String(data);
  }
}
