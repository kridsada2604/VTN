export type SaveInventoryMasterInput = {
  id: string | null;
  code: string;
  name: string;
};

export type ToggleInventoryMasterInput = {
  id: string;
  next: boolean;
};

const text = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();

export function parseInventoryMasterForm(fd: FormData, label: string): SaveInventoryMasterInput {
  const input = {
    id: text(fd, "id") || null,
    code: text(fd, "code"),
    name: text(fd, "name"),
  };

  if (!input.code || !input.name) throw new Error(label + " code and name are required");
  return input;
}

export function parseToggleInventoryMasterForm(fd: FormData, label: string): ToggleInventoryMasterInput {
  const input = {
    id: text(fd, "id"),
    next: text(fd, "next") === "true",
  };

  if (!input.id) throw new Error(label + " is required");
  return input;
}
