export const permissionModules = [
  { key: "DASHBOARD", label: "Dashboard" },
  { key: "SALES", label: "Sales" },
  { key: "PURCHASE", label: "Purchase" },
  { key: "INVENTORY", label: "Inventory" },
  { key: "ACCOUNTING", label: "Accounting" },
  { key: "CRM", label: "CRM" },
  { key: "PROJECTS", label: "Projects" },
  { key: "CLAIMS", label: "Claims" },
  { key: "POS", label: "POS" },
  { key: "MARKETPLACE", label: "Marketplace" },
  { key: "REPORTS", label: "Report Center" },
  { key: "AI", label: "AI Assistant" },
  { key: "SETTINGS", label: "Settings" },
] as const;

export const permissionActions = [
  { key: "VIEW", label: "View" },
  { key: "CREATE", label: "Create" },
  { key: "UPDATE", label: "Update" },
  { key: "APPROVE", label: "Approve" },
  { key: "POST", label: "Post" },
  { key: "EXPORT", label: "Export" },
  { key: "MANAGE", label: "Manage" },
] as const;

export type PermissionModuleKey = (typeof permissionModules)[number]["key"];
export type PermissionActionKey = (typeof permissionActions)[number]["key"];

const moduleKeys = new Set<string>(permissionModules.map((module) => module.key));
const actionKeys = new Set<string>(permissionActions.map((action) => action.key));

export function isPermissionModuleKey(value: string): value is PermissionModuleKey {
  return moduleKeys.has(value);
}

export function isPermissionActionKey(value: string): value is PermissionActionKey {
  return actionKeys.has(value);
}

export function defaultPermissionForRole(roleCode: string, actionKey: PermissionActionKey) {
  if (roleCode === "OWNER" || roleCode === "ADMIN") return true;
  return actionKey === "VIEW";
}
