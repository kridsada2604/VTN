import type { QuotationItemInput } from "@/lib/validation/sales/quotation";

export type QuotationComputedItem = QuotationItemInput & {
  line_subtotal: number;
  line_discount: number;
  line_tax: number;
  line_total: number;
  sort_order: number;
};

export type QuotationTotals = {
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  grand_total_amount: number;
  withholding_tax_amount: number;
  net_payable_amount: number;
  total_amount: number;
};

export type QuotationInstallmentInput = {
  installment_no: number;
  due_date: string;
  description: string;
  percent: number;
  amount: number;
};

const roundMoney = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

function addMonths(dateText: string, months: number) {
  const base = dateText ? new Date(`${dateText}T00:00:00`) : new Date();
  base.setMonth(base.getMonth() + months);
  return base.toISOString().slice(0, 10);
}

export function computeQuotationItems(items: QuotationItemInput[], isVatRegistered: boolean, withholdingTaxRate: number) {
  const totals: QuotationTotals = {
    subtotal: 0,
    discount_amount: 0,
    tax_amount: 0,
    grand_total_amount: 0,
    withholding_tax_amount: 0,
    net_payable_amount: 0,
    total_amount: 0,
  };

  const computedItems: QuotationComputedItem[] = items.map((item, index) => {
    const lineSubtotal = roundMoney(item.quantity * item.unit_price);
    const lineDiscount = roundMoney((lineSubtotal * item.discount_percent) / 100);
    const taxableAmount = roundMoney(lineSubtotal - lineDiscount);
    const lineTax = isVatRegistered ? roundMoney((taxableAmount * item.tax_rate) / 100) : 0;
    const lineTotal = roundMoney(taxableAmount + lineTax);

    totals.subtotal = roundMoney(totals.subtotal + lineSubtotal);
    totals.discount_amount = roundMoney(totals.discount_amount + lineDiscount);
    totals.tax_amount = roundMoney(totals.tax_amount + lineTax);

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
  totals.grand_total_amount = roundMoney(taxableBase + totals.tax_amount);
  totals.withholding_tax_amount = roundMoney((taxableBase * withholdingTaxRate) / 100);
  totals.net_payable_amount = roundMoney(totals.grand_total_amount - totals.withholding_tax_amount);
  totals.total_amount = totals.net_payable_amount;

  return { computedItems, totals };
}

export function buildQuotationInstallments(totalAmount: number, count: number, startDate: string) {
  const safeCount = Math.min(Math.max(Math.trunc(count || 1), 1), 24);
  const baseAmount = roundMoney(totalAmount / safeCount);
  let assigned = 0;

  return Array.from({ length: safeCount }, (_, index): QuotationInstallmentInput => {
    const installmentNo = index + 1;
    const amount = installmentNo === safeCount ? roundMoney(totalAmount - assigned) : baseAmount;
    assigned = roundMoney(assigned + amount);
    return {
      installment_no: installmentNo,
      due_date: addMonths(startDate, index),
      description: `Installment ${installmentNo}/${safeCount}`,
      percent: roundMoney(100 / safeCount),
      amount,
    };
  });
}
