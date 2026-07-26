import { isPermissionActionKey, isPermissionModuleKey } from "@/lib/permissions/catalog";
import type { PermissionActionKey, PermissionModuleKey } from "@/lib/permissions/catalog";

export type UpdateRolePermissionInput = {
  role_id: string;
  module_key: PermissionModuleKey;
  action_key: PermissionActionKey;
  is_allowed: boolean;
};

const text = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();

export function parseUpdateRolePermissionForm(fd: FormData): UpdateRolePermissionInput {
  const moduleKey = text(fd, "module_key");
  const actionKey = text(fd, "action_key");
  const input = {
    role_id: text(fd, "role_id"),
    module_key: moduleKey,
    action_key: actionKey,
    is_allowed: text(fd, "is_allowed") === "true",
  };

  if (!input.role_id) throw new Error("Role is required");
  if (!isPermissionModuleKey(input.module_key)) throw new Error("Module is invalid");
  if (!isPermissionActionKey(input.action_key)) throw new Error("Action is invalid");

  return input as UpdateRolePermissionInput;
}
