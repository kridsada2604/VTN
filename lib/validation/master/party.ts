export type MasterPartyInput = {
  id: string | null;
  code: string;
  name: string;
  tax_id: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
};

export type ToggleMasterPartyInput = {
  id: string;
  is_active: boolean;
};

const text = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();

export function parseMasterPartyForm(fd: FormData, label: string): MasterPartyInput {
  const input: MasterPartyInput = {
    id: text(fd, "id") || null,
    code: text(fd, "code"),
    name: text(fd, "name"),
    tax_id: text(fd, "tax_id") || null,
    phone: text(fd, "phone") || null,
    email: text(fd, "email") || null,
    address: text(fd, "address") || null,
  };

  if (!input.code || !input.name) throw new Error(`${label} code and name are required`);
  return input;
}

export function parseToggleMasterPartyForm(fd: FormData, label: string): ToggleMasterPartyInput {
  const input = {
    id: text(fd, "id"),
    is_active: text(fd, "next") === "true",
  };

  if (!input.id) throw new Error(`${label} is required`);
  return input;
}
