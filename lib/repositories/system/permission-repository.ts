import type { createClient } from "@/lib/supabase/server";
import type { UpdateRolePermissionInput } from "@/lib/validation/system/permission";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export type PermissionRoleRow = {
  id: string;
  code: string;
  name: string;
  description: string | null;
};

export type RolePermissionRow = {
  id: string;
  role_id: string;
  module_key: string;
  action_key: string;
  is_allowed: boolean;
};

export class PermissionRepository {
  constructor(private readonly supabase: SupabaseServerClient) {}

  async listRoles() {
    const { data, error } = await this.supabase
      .from("roles")
      .select("id,code,name,description")
      .order("code");

    if (error) throw error;
    return (data ?? []) as PermissionRoleRow[];
  }

  async listPermissions(companyId: string) {
    const { data, error } = await this.supabase
      .from("company_role_permissions")
      .select("id,role_id,module_key,action_key,is_allowed")
      .eq("company_id", companyId)
      .order("module_key")
      .order("action_key");

    if (error) throw error;
    return (data ?? []) as RolePermissionRow[];
  }

  async updatePermission(companyId: string, input: UpdateRolePermissionInput) {
    const { data, error } = await this.supabase.rpc("upsert_company_role_permission", {
      p_company_id: companyId,
      p_role_id: input.role_id,
      p_module_key: input.module_key,
      p_action_key: input.action_key,
      p_is_allowed: input.is_allowed,
    });

    if (error) throw error;
    return String(data);
  }
}
