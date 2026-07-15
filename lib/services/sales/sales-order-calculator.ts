import type { SalesOrderItemInput } from "@/lib/validation/sales/sales-order";

export type SalesOrderComputedItem = SalesOrderItemInput & {
  line_subtotal: number;
  line_discount: number;
  line_tax: number;
  line_total: number;
  sort_order: number;
};

const roundMoney = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

export function computeSalesOrderItems(items: SalesOrderItemInput[]) {
  const totals = {
    subtotal: 0,
    discount_amount: 0,
    tax_amount: 0,
    total_amount: 0,
  };

  const computedItems: SalesOrderComputedItem[] = items.map((item, index) => {
    const lineSubtotal = roundMoney(item.quantity * item.unit_price);
    const lineDiscount = roundMoney((lineSubtotal * item.discount_percent) / 100);
    const lineTax = roundMoney(((lineSubtotal - lineDiscount) * item.tax_rate) / 100);
    const lineTotal = roundMoney(lineSubtotal - lineDiscount + lineTax);

    totals.subtotal = roundMoney(totals.subtotal + lineSubtotal);
    totals.discount_amount = roundMoney(totals.discount_amount + lineDiscount);
    totals.tax_amount = roundMoney(totals.tax_amount + lineTax);
    totals.total_amount = roundMoney(totals.total_amount + lineTotal);

    return {
      ...item,
      line_subtotal: lineSubtotal,
      line_discount: lineDiscount,
      line_tax: lineTax,
      line_total: lineTotal,
      sort_order: index + 1,
    };
  });

  return { computedItems, totals };
}
