export type InventoryExternalItemInput = {
  product_id: string | null;
  product_sku: string | null;
  stock_on_hand: number;
  inbound_qty: number;
  outbound_qty: number;
  adjustment_qty: number;
};

export type CreateInventoryExternalInput = {
  dealer_id: string;
  period_month: string;
  source_channel: string;
  notes: string | null;
  items: InventoryExternalItemInput[];
};

export function validateInventoryExternalInput(input: CreateInventoryExternalInput) {
  if (!input.dealer_id) throw new Error("Dealer is required");
  if (!/^\d{4}-\d{2}$/.test(input.period_month)) throw new Error("Inventory period month is required");
  if (!input.items.length) throw new Error("At least one inventory item is required");
  if (input.items.some((item) => item.stock_on_hand < 0 || item.inbound_qty < 0 || item.outbound_qty < 0)) {
    throw new Error("Inventory stock, inbound, and outbound quantities cannot be negative");
  }
}
