export type SaleInItemInput = {
  product_id: string | null;
  dealer_sku: string | null;
  description: string;
  quantity: number;
  unit_price: number;
  line_discount: number;
};

export type CreateSaleInInput = {
  dealer_id: string;
  report_date: string;
  period_start: string;
  period_end: string;
  source_channel: string;
  currency_code: string;
  notes: string | null;
  items: SaleInItemInput[];
};

export function validateSaleInInput(input: CreateSaleInInput) {
  if (!input.dealer_id) throw new Error("Dealer is required");
  if (!input.report_date) throw new Error("Report date is required");
  if (!input.period_start || !input.period_end) throw new Error("Sale In period is required");
  if (input.period_start > input.period_end) throw new Error("Period start must be before period end");
  if (!input.items.length) throw new Error("At least one Sale In item is required");
  if (input.items.some((item) => !item.description || item.quantity <= 0 || item.unit_price < 0 || item.line_discount < 0)) {
    throw new Error("Sale In item description, quantity, price, and discount are invalid");
  }
}
