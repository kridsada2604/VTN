export type UpsertDealerTargetInput = {
  dealer_id: string;
  period_start: string;
  period_end: string;
  target_amount: number;
  notes: string | null;
};

const text = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();

const numberOrZero = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export function parseDealerTargetForm(fd: FormData): UpsertDealerTargetInput {
  const input = {
    dealer_id: text(fd, "dealer_id"),
    period_start: text(fd, "period_start"),
    period_end: text(fd, "period_end"),
    target_amount: numberOrZero(fd.get("target_amount")),
    notes: text(fd, "notes") || null,
  };

  if (!input.dealer_id) throw new Error("Dealer is required");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.period_start) || !/^\d{4}-\d{2}-\d{2}$/.test(input.period_end)) {
    throw new Error("Target period is required");
  }
  if (input.period_start > input.period_end) throw new Error("Period start must be before period end");
  if (input.target_amount < 0) throw new Error("Target amount cannot be negative");

  return input;
}
