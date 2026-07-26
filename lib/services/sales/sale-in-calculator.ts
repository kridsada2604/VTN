import type { SaleInItemInput } from "@/lib/validation/sales/sale-in";

export type SaleInComputedItem = SaleInItemInput & {
  sort_order: number;
  line_total: number;
};

export type SaleInTotals = {
  gross_amount: number;
  discount_amount: number;
  net_amount: number;
};

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function computeSaleInItems(items: SaleInItemInput[]) {
  const totals: SaleInTotals = { gross_amount: 0, discount_amount: 0, net_amount: 0 };
  const computedItems = items.map((item, index) => {
    const gross = roundMoney(item.quantity * item.unit_price);
    const lineTotal = roundMoney(gross - item.line_discount);
    totals.gross_amount += gross;
    totals.discount_amount += item.line_discount;
    totals.net_amount += lineTotal;
    return { ...item, sort_order: index + 1, line_total: lineTotal };
  });

  totals.gross_amount = roundMoney(totals.gross_amount);
  totals.discount_amount = roundMoney(totals.discount_amount);
  totals.net_amount = roundMoney(totals.net_amount);

  return { computedItems, totals };
}
