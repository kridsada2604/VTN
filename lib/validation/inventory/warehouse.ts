export type SaveWarehouseInput = {
  id: string | null;
  branch_id: string;
  code: string;
  name: string;
};

export type ToggleWarehouseInput = {
  id: string;
  next: boolean;
};

const text = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();

export function parseWarehouseForm(fd: FormData): SaveWarehouseInput {
  const input = {
    id: text(fd, "id") || null,
    branch_id: text(fd, "branch_id"),
    code: text(fd, "code"),
    name: text(fd, "name"),
  };

  if (!input.branch_id || !input.code || !input.name) throw new Error("Warehouse branch, code, and name are required");
  return input;
}

export function parseToggleWarehouseForm(fd: FormData): ToggleWarehouseInput {
  const input = {
    id: text(fd, "id"),
    next: text(fd, "next") === "true",
  };

  if (!input.id) throw new Error("Warehouse is required");
  return input;
}
