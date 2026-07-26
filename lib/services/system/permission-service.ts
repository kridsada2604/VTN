import { getCurrentCompanyId } from "@/lib/current-company";
import { defaultPermissionForRole, permissionActions, permissionModules } from "@/lib/permissions/catalog";
import { PermissionRepository } from "@/lib/repositories/system/permission-repository";
import { createClient } from "@/lib/supabase/server";
import type { PermissionActionKey, PermissionModuleKey } from "@/lib/permissions/catalog";
import type { UpdateRolePermissionInput } from "@/lib/validation/system/permission";

export type PermissionMatrixCell = {
  module_key: PermissionModuleKey;
  action_key: PermissionActionKey;
  is_allowed: boolean;
  persisted: boolean;
};

export type PermissionMatrixRole = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  cells: PermissionMatrixCell[];
};

async function getRepository() {
  const supabase = await createClient();
  const companyId = await getCurrentCompanyId();
  return { companyId, repository: new PermissionRepository(supabase) };
}

export async function getPermissionMatrix() {
  const { companyId, repository } = await getRepository();
  const [roles, permissions] = await Promise.all([
    repository.listRoles(),
    repository.listPermissions(companyId),
  ]);
  const permissionMap = new Map(permissions.map((permission) => [`${permission.role_id}:${permission.module_key}:${permission.action_key}`, permission]));
  const rolesWithCells: PermissionMatrixRole[] = roles.map((role) => ({
    ...role,
    cells: permissionModules.flatMap((module) => permissionActions.map((action) => {
      const persisted = permissionMap.get(`${role.id}:${module.key}:${action.key}`);
      return {
        module_key: module.key,
        action_key: action.key,
        is_allowed: persisted?.is_allowed ?? defaultPermissionForRole(role.code, action.key),
        persisted: Boolean(persisted),
      };
    })),
  }));

  return { modules: permissionModules, actions: permissionActions, roles: rolesWithCells };
}

export async function updateRolePermission(input: UpdateRolePermissionInput) {
  const { companyId, repository } = await getRepository();
  return repository.updatePermission(companyId, input);
}
