export type MonthOfInventoryItemInput = {
  product_id: string | null;
  product_sku: string | null;
  stock_on_hand: number;
  average_monthly_sale_out: number;
  month_of_inventory: number;
  reorder_note: string | null;
};

export type CreateMonthOfInventoryInput = {
  dealer_id: string;
  period_month: string;
  source_channel: string;
  notes: string | null;
  items: MonthOfInventoryItemInput[];
};

export function validateMonthOfInventoryInput(input: CreateMonthOfInventoryInput) {
  if (!input.dealer_id) throw new Error("Dealer is required");
  if (!/^\d{4}-\d{2}$/.test(input.period_month)) throw new Error("MOI period month is required");
  if (!input.items.length) throw new Error("At least one MOI item is required");
  if (input.items.some((item) => item.stock_on_hand < 0 || item.average_monthly_sale_out < 0 || item.month_of_inventory < 0)) {
    throw new Error("MOI quantities cannot be negative");
  }
}
