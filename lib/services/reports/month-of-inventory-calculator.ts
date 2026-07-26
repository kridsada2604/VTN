import type { MonthOfInventoryItemInput } from "@/lib/validation/reports/month-of-inventory";

export type MonthOfInventoryComputedItem = MonthOfInventoryItemInput & { sort_order: number };

export type MonthOfInventoryTotals = {
  total_stock_on_hand: number;
  total_average_monthly_sale_out: number;
  average_month_of_inventory: number;
  reorder_count: number;
};

export function computeMonthOfInventoryItems(items: MonthOfInventoryItemInput[]) {
  const computedItems = items.map((item, index) => ({ ...item, sort_order: index + 1 }));
  const totalStock = items.reduce((sum, item) => sum + item.stock_on_hand, 0);
  const totalAverageSaleOut = items.reduce((sum, item) => sum + item.average_monthly_sale_out, 0);
  const weightedMoi = totalAverageSaleOut > 0 ? totalStock / totalAverageSaleOut : 0;
  return {
    computedItems,
    totals: {
      total_stock_on_hand: totalStock,
      total_average_monthly_sale_out: totalAverageSaleOut,
      average_month_of_inventory: Math.round((weightedMoi + Number.EPSILON) * 100) / 100,
      reorder_count: items.filter((item) => item.month_of_inventory < 1 || /reorder/i.test(item.reorder_note ?? "")).length,
    },
  };
}
