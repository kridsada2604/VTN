export type CreateCommissionRuleInput = {
  name: string;
  basis: "SALE_OUT_NET" | "SALE_OUT_GROSS";
  rate_percent: number;
  minimum_base_amount: number;
  effective_from: string | null;
  effective_to: string | null;
};

export type CreateCommissionRunInput = {
  rule_id: string;
  period_start: string;
  period_end: string;
};

const text = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();

const numberOrZero = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const dateOrNull = (value: string) => (/^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null);

export function parseCommissionRuleForm(fd: FormData): CreateCommissionRuleInput {
  const basis = text(fd, "basis").toUpperCase();
  const input: CreateCommissionRuleInput = {
    name: text(fd, "name"),
    basis: basis === "SALE_OUT_GROSS" ? "SALE_OUT_GROSS" : "SALE_OUT_NET",
    rate_percent: numberOrZero(fd.get("rate_percent")),
    minimum_base_amount: numberOrZero(fd.get("minimum_base_amount")),
    effective_from: dateOrNull(text(fd, "effective_from")),
    effective_to: dateOrNull(text(fd, "effective_to")),
  };

  if (!input.name) throw new Error("Commission rule name is required");
  if (input.rate_percent < 0 || input.rate_percent > 100) throw new Error("Commission rate must be between 0 and 100");
  if (input.minimum_base_amount < 0) throw new Error("Minimum base amount cannot be negative");
  if (input.effective_from && input.effective_to && input.effective_from > input.effective_to) throw new Error("Effective from must be before effective to");

  return input;
}

export function parseCommissionRunForm(fd: FormData): CreateCommissionRunInput {
  const input = {
    rule_id: text(fd, "rule_id"),
    period_start: text(fd, "period_start"),
    period_end: text(fd, "period_end"),
  };

  if (!input.rule_id) throw new Error("Commission rule is required");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.period_start) || !/^\d{4}-\d{2}-\d{2}$/.test(input.period_end)) {
    throw new Error("Commission period is required");
  }
  if (input.period_start > input.period_end) throw new Error("Period start must be before period end");

  return input;
}
