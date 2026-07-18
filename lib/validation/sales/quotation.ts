export type QuotationItemInput = {
  product_id: string | null;
  description: string;
  quantity: number;
  unit_price: number;
  discount_percent: number;
  tax_rate: number;
};

export type CreateQuotationInput = {
  customer_id: string;
  quotation_date: string;
  valid_until: string | null;
  salesperson: string | null;
  project_name: string | null;
  payment_terms: string | null;
  currency_code: string;
  notes: string | null;
  is_vat_registered: boolean;
  withholding_tax_rate: number;
  installment_count: number;
  items: QuotationItemInput[];
};

export type UpdateQuotationStatusInput = {
  quotation_id: string;
  status: string;
};

const text = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();

const numberOrZero = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export function parseQuotationForm(fd: FormData): CreateQuotationInput {
  let items: QuotationItemInput[] = [];

  try {
    const parsed = JSON.parse(text(fd, "items") || "[]") as Array<Partial<QuotationItemInput>>;
    items = parsed.map((item) => ({
      product_id: item.product_id ? String(item.product_id) : null,
      description: String(item.description ?? "").trim(),
      quantity: numberOrZero(item.quantity),
      unit_price: numberOrZero(item.unit_price),
      discount_percent: numberOrZero(item.discount_percent),
      tax_rate: numberOrZero(item.tax_rate),
    }));
  } catch {
    throw new Error("Quotation items are invalid");
  }

  const input: CreateQuotationInput = {
    customer_id: text(fd, "customer_id"),
    quotation_date: text(fd, "quotation_date") || new Date().toISOString().slice(0, 10),
    valid_until: text(fd, "valid_until") || null,
    salesperson: text(fd, "salesperson") || null,
    project_name: text(fd, "project_name") || null,
    payment_terms: text(fd, "payment_terms") || null,
    currency_code: text(fd, "currency_code") || "THB",
    notes: text(fd, "notes") || null,
    is_vat_registered: text(fd, "is_vat_registered") !== "false",
    withholding_tax_rate: numberOrZero(fd.get("withholding_tax_rate")),
    installment_count: numberOrZero(fd.get("installment_count")) || 1,
    items,
  };

  if (!input.customer_id) throw new Error("Customer is required");
  if (!input.items.length) throw new Error("Quotation requires at least one item");
  if (input.items.some((item) => !item.description || item.quantity <= 0 || item.unit_price < 0 || item.discount_percent < 0 || item.tax_rate < 0)) {
    throw new Error("Please check quotation items, quantity, price, discount, and tax");
  }
  if (input.withholding_tax_rate < 0 || input.withholding_tax_rate > 100) throw new Error("Withholding tax rate must be between 0 and 100");
  return input;
}

export function parseQuotationStatusForm(fd: FormData): UpdateQuotationStatusInput {
  const input = {
    quotation_id: text(fd, "id") || text(fd, "quotation_id"),
    status: text(fd, "status"),
  };

  if (!input.quotation_id) throw new Error("Quotation is required");
  if (!input.status) throw new Error("Quotation status is required");
  return input;
}
