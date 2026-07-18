import type { PurchaseOrderItemInput } from "@/lib/validation/purchase/purchase-order";

export type PurchaseOrderComputedItem = PurchaseOrderItemInput & {
  line_subtotal: number;
  line_discount: number;
  line_tax: number;
  line_total: number;
  sort_order: number;
};

export type PurchaseOrderTotals = {
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
};

const roundMoney = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

export function computePurchaseOrderItems(items: PurchaseOrderItemInput[], isVatRegistered = true) {
  const totals: PurchaseOrderTotals = {
    subtotal: 0,
    discount_amount: 0,
    tax_amount: 0,
    total_amount: 0,
  };

  const computedItems: PurchaseOrderComputedItem[] = items.map((item, index) => {
    const lineSubtotal = roundMoney(item.quantity * item.unit_cost);
    const lineDiscount = roundMoney((lineSubtotal * item.discount_percent) / 100);
    const taxableAmount = lineSubtotal - lineDiscount;
    const lineTax = isVatRegistered ? roundMoney((taxableAmount * item.tax_rate) / 100) : 0;
    const lineTotal = roundMoney(taxableAmount + lineTax);

    totals.subtotal = roundMoney(totals.subtotal + lineSubtotal);
    totals.discount_amount = roundMoney(totals.discount_amount + lineDiscount);
    totals.tax_amount = roundMoney(totals.tax_amount + lineTax);
    totals.total_amount = roundMoney(totals.total_amount + lineTotal);

    return { ...item, tax_rate: isVatRegistered ? item.tax_rate : 0, line_subtotal: lineSubtotal, line_discount: lineDiscount, line_tax: lineTax, line_total: lineTotal, sort_order: index };
  });

  return { computedItems, totals };
}
