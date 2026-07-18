export type InvoiceItemInput = {
  product_id: string | null;
  description: string;
  quantity: number;
  unit_price: number;
  discount_percent: number;
  tax_rate: number;
};

export type CreateInvoiceInput = {
  customer_id: string;
  invoice_date: string;
  due_date: string | null;
  payment_terms: string | null;
  currency_code: string;
  notes: string | null;
  is_vat_registered: boolean;
  withholding_tax_rate: number;
  installment_count: number;
  items: InvoiceItemInput[];
};

export type ReceivePaymentInput = {
  invoice_id: string;
  payment_date: string;
  method: string;
  amount: number;
  reference_no: string | null;
  notes: string | null;
};

const text = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();
const numberOrZero = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export function parseInvoiceForm(fd: FormData): CreateInvoiceInput {
  const rawItems = text(fd, "items");
  let items: InvoiceItemInput[] = [];

  try {
    const parsed = JSON.parse(rawItems || "[]") as Array<Partial<InvoiceItemInput>>;
    items = parsed.map((item) => ({
      product_id: item.product_id ? String(item.product_id) : null,
      description: String(item.description ?? "").trim(),
      quantity: numberOrZero(item.quantity),
      unit_price: numberOrZero(item.unit_price),
      discount_percent: numberOrZero(item.discount_percent),
      tax_rate: numberOrZero(item.tax_rate),
    }));
  } catch {
    throw new Error("Invoice items are invalid JSON");
  }

  const input: CreateInvoiceInput = {
    customer_id: text(fd, "customer_id"),
    invoice_date: text(fd, "invoice_date"),
    due_date: text(fd, "due_date") || null,
    payment_terms: text(fd, "payment_terms") || null,
    currency_code: text(fd, "currency_code") || "THB",
    notes: text(fd, "notes") || null,
    is_vat_registered: text(fd, "is_vat_registered") !== "false",
    withholding_tax_rate: numberOrZero(fd.get("withholding_tax_rate")),
    installment_count: Math.min(Math.max(Math.trunc(numberOrZero(fd.get("installment_count")) || 1), 1), 24),
    items,
  };

  if (!input.customer_id) throw new Error("Customer is required");
  if (!input.invoice_date) throw new Error("Invoice date is required");
  if (input.withholding_tax_rate < 0 || input.withholding_tax_rate > 100) throw new Error("Withholding tax rate must be between 0 and 100");
  if (!input.items.length) throw new Error("At least one invoice item is required");
  if (input.items.some((item) => !item.description || item.quantity <= 0 || item.unit_price < 0)) {
    throw new Error("Invoice item description, quantity, and price are required");
  }

  return input;
}

export function parseReceivePaymentForm(fd: FormData): ReceivePaymentInput {
  const input: ReceivePaymentInput = {
    invoice_id: text(fd, "invoice_id"),
    payment_date: text(fd, "payment_date"),
    method: text(fd, "method"),
    amount: numberOrZero(fd.get("amount")),
    reference_no: text(fd, "reference_no") || null,
    notes: text(fd, "notes") || null,
  };

  if (!input.invoice_id) throw new Error("Invoice is required");
  if (!input.payment_date) throw new Error("Payment date is required");
  if (!input.method) throw new Error("Payment method is required");
  if (input.amount <= 0) throw new Error("Payment amount must be greater than zero");

  return input;
}