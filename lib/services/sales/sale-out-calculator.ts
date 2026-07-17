import type { SaleOutItemInput } from "@/lib/validation/sales/sale-out";

export type SaleOutComputedItem = SaleOutItemInput & {
  line_total: number;
  sort_order: number;
};

export type SaleOutTotals = {
  gross_amount: number;
  discount_amount: number;
  net_amount: number;
};

export function computeSaleOutItems(items: SaleOutItemInput[]) {
  const computedItems: SaleOutComputedItem[] = items.map((item, index) => {
    const gross = item.quantity * item.unit_price;
    const lineTotal = Math.max(gross - item.line_discount, 0);

    return {
      ...item,
      line_total: Number(lineTotal.toFixed(2)),
      sort_order: index + 1,
    };
  });

  const totals = computedItems.reduce<SaleOutTotals>(
    (acc, item) => {
      acc.gross_amount += item.quantity * item.unit_price;
      acc.discount_amount += item.line_discount;
      acc.net_amount += item.line_total;
      return acc;
    },
    { gross_amount: 0, discount_amount: 0, net_amount: 0 },
  );

  return {
    computedItems,
    totals: {
      gross_amount: Number(totals.gross_amount.toFixed(2)),
      discount_amount: Number(totals.discount_amount.toFixed(2)),
      net_amount: Number(totals.net_amount.toFixed(2)),
    },
  };
}
