export type SaleOutItemInput = {
  product_id: string | null;
  dealer_sku: string | null;
  description: string;
  quantity: number;
  unit_price: number;
  line_discount: number;
};

export type CreateSaleOutInput = {
  dealer_id: string;
  salesperson_id: string | null;
  report_date: string;
  period_start: string;
  period_end: string;
  source_channel: string;
  currency_code: string;
  notes: string | null;
  items: SaleOutItemInput[];
};

const text = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();

const numberOrZero = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export function parseSaleOutForm(fd: FormData): CreateSaleOutInput {
  let items: SaleOutItemInput[] = [];

  try {
    const parsed = JSON.parse(text(fd, "items") || "[]") as Array<Partial<SaleOutItemInput>>;
    items = parsed.map((item) => ({
      product_id: item.product_id ? String(item.product_id) : null,
      dealer_sku: item.dealer_sku ? String(item.dealer_sku).trim() : null,
      description: String(item.description ?? "").trim(),
      quantity: numberOrZero(item.quantity),
      unit_price: numberOrZero(item.unit_price),
      line_discount: numberOrZero(item.line_discount),
    }));
  } catch {
    throw new Error("Sale Out items must be valid JSON");
  }

  const input = {
    dealer_id: text(fd, "dealer_id"),
    salesperson_id: text(fd, "salesperson_id") || null,
    report_date: text(fd, "report_date"),
    period_start: text(fd, "period_start"),
    period_end: text(fd, "period_end"),
    source_channel: text(fd, "source_channel") || "DEALER",
    currency_code: text(fd, "currency_code") || "THB",
    notes: text(fd, "notes") || null,
    items,
  };

  if (!input.dealer_id) throw new Error("Dealer is required");
  if (!input.report_date) throw new Error("Report date is required");
  if (!input.period_start || !input.period_end) throw new Error("Sale Out period is required");
  if (input.period_start > input.period_end) throw new Error("Period start must be before period end");
  if (!input.items.length) throw new Error("At least one Sale Out item is required");
  if (input.items.some((item) => !item.description || item.quantity <= 0 || item.unit_price < 0 || item.line_discount < 0)) {
    throw new Error("Sale Out item description, quantity, price, and discount are invalid");
  }

  return input;
}
