import type { CreateInvoiceInput, InvoiceItemInput } from "@/lib/validation/sales/invoice";

export type InvoiceComputedItem = InvoiceItemInput & {
  line_subtotal: number;
  line_discount: number;
  line_tax: number;
  line_total: number;
  sort_order: number;
};

export type InvoiceTotals = {
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  grand_total_amount: number;
  withholding_tax_amount: number;
  total_amount: number;
};

const roundMoney = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

export function computeInvoiceItems(input: Pick<CreateInvoiceInput, "items" | "is_vat_registered" | "withholding_tax_rate"> | InvoiceItemInput[]) {
  const items = Array.isArray(input) ? input : input.items;
  const isVatRegistered = Array.isArray(input) ? true : input.is_vat_registered;
  const withholdingTaxRate = Array.isArray(input) ? 0 : input.withholding_tax_rate;
  const totals: InvoiceTotals = {
    subtotal: 0,
    discount_amount: 0,
    tax_amount: 0,
    grand_total_amount: 0,
    withholding_tax_amount: 0,
    total_amount: 0,
  };

  const computedItems: InvoiceComputedItem[] = items.map((item, index) => {
    const lineSubtotal = roundMoney(item.quantity * item.unit_price);
    const lineDiscount = roundMoney((lineSubtotal * item.discount_percent) / 100);
    const taxableAmount = lineSubtotal - lineDiscount;
    const lineTax = isVatRegistered ? roundMoney((taxableAmount * item.tax_rate) / 100) : 0;
    const lineTotal = roundMoney(taxableAmount + lineTax);

    totals.subtotal = roundMoney(totals.subtotal + lineSubtotal);
    totals.discount_amount = roundMoney(totals.discount_amount + lineDiscount);
    totals.tax_amount = roundMoney(totals.tax_amount + lineTax);
    totals.grand_total_amount = roundMoney(totals.grand_total_amount + lineTotal);

    return {
      ...item,
      tax_rate: isVatRegistered ? item.tax_rate : 0,
      line_subtotal: lineSubtotal,
      line_discount: lineDiscount,
      line_tax: lineTax,
      line_total: lineTotal,
      sort_order: index,
    };
  });

  const taxableBase = roundMoney(totals.subtotal - totals.discount_amount);
  totals.withholding_tax_amount = roundMoney((taxableBase * withholdingTaxRate) / 100);
  totals.total_amount = roundMoney(totals.grand_total_amount - totals.withholding_tax_amount);

  return { computedItems, totals };
}