export type CreateLeadInput = {
  name: string;
  company_name: string | null;
  email: string | null;
  phone: string | null;
  source: string | null;
  notes: string | null;
};

const text = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();

export function parseLeadForm(fd: FormData): CreateLeadInput {
  const input: CreateLeadInput = {
    name: text(fd, "name"),
    company_name: text(fd, "company_name") || null,
    email: text(fd, "email") || null,
    phone: text(fd, "phone") || null,
    source: text(fd, "source") || null,
    notes: text(fd, "notes") || null,
  };

  if (!input.name) throw new Error("กรุณาระบุชื่อ Lead");
  return input;
}
