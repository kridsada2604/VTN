import type { InventoryExternalItemInput } from "@/lib/validation/reports/external-inventory";

export type InventoryExternalComputedItem = InventoryExternalItemInput & {
  sort_order: number;
};

export type InventoryExternalTotals = {
  total_stock_on_hand: number;
  total_inbound_qty: number;
  total_outbound_qty: number;
  total_adjustment_qty: number;
};

export function computeExternalInventoryItems(items: InventoryExternalItemInput[]) {
  const totals: InventoryExternalTotals = {
    total_stock_on_hand: 0,
    total_inbound_qty: 0,
    total_outbound_qty: 0,
    total_adjustment_qty: 0,
  };

  const computedItems = items.map((item, index) => {
    totals.total_stock_on_hand += item.stock_on_hand;
    totals.total_inbound_qty += item.inbound_qty;
    totals.total_outbound_qty += item.outbound_qty;
    totals.total_adjustment_qty += item.adjustment_qty;
    return { ...item, sort_order: index + 1 };
  });

  return { computedItems, totals };
}
