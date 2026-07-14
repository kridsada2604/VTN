export type CreateProjectInput = {
  customer_id: string | null;
  name: string;
  start_date: string | null;
  end_date: string | null;
  budget_amount: number;
  notes: string | null;
};

const text = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();

export function parseProjectForm(fd: FormData): CreateProjectInput {
  const budget = Number(fd.get("budget_amount") ?? 0);
  const input: CreateProjectInput = {
    customer_id: text(fd, "customer_id") || null,
    name: text(fd, "name"),
    start_date: text(fd, "start_date") || null,
    end_date: text(fd, "end_date") || null,
    budget_amount: Number.isFinite(budget) ? budget : 0,
    notes: text(fd, "notes") || null,
  };

  if (!input.name) throw new Error("กรุณาระบุชื่อโครงการ");
  if (input.budget_amount < 0) throw new Error("งบประมาณต้องไม่ติดลบ");
  return input;
}
