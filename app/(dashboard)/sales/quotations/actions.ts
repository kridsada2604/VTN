"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentCompanyId } from "@/lib/current-company";
import { createSalesOrderFromQuotation } from "@/lib/services/sales/sales-order-service";
import { parseQuotationToSalesOrderForm } from "@/lib/validation/sales/sales-order";

const text = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();
const numberOrZero = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};
const roundMoney = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

function addMonths(dateText: string, months: number) {
  const base = dateText ? new Date(`${dateText}T00:00:00`) : new Date();
  base.setMonth(base.getMonth() + months);
  return base.toISOString().slice(0, 10);
}

function buildInstallments(totalAmount: number, count: number, startDate: string) {
  const safeCount = Math.min(Math.max(Math.trunc(count || 1), 1), 24);
  const baseAmount = roundMoney(totalAmount / safeCount);
  let assigned = 0;
  return Array.from({ length: safeCount }, (_, index) => {
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

export async function saveQuotation(fd: FormData) {
  const supabase = await createClient();
  const companyId = await getCurrentCompanyId();
  const { data: { user } } = await supabase.auth.getUser();
  const items = JSON.parse(text(fd, "items") || "[]") as Array<{ product_id?: string; description: string; quantity: number; unit_price: number; discount_percent: number; tax_rate: number }>;
  if (!text(fd, "customer_id") || !items.length || items.some((item) => !item.description || Number(item.quantity) <= 0)) throw new Error("Customer and quotation items are required");

  const isVatRegistered = text(fd, "is_vat_registered") !== "false";
  const withholdingTaxRate = numberOrZero(fd.get("withholding_tax_rate"));
  const installmentCount = numberOrZero(fd.get("installment_count")) || 1;
  const { data: documentNo, error: noErr } = await supabase.rpc("next_document_number", { p_company_id: companyId, p_document_type: "QUOTATION", p_prefix: "QT" });
  if (noErr) throw noErr;

  let subtotal = 0;
  let discount = 0;
  let tax = 0;
  const computed = items.map((item, index) => {
    const lineSubtotal = roundMoney(Number(item.quantity) * Number(item.unit_price));
    const lineDiscount = roundMoney((lineSubtotal * Number(item.discount_percent || 0)) / 100);
    const taxableAmount = lineSubtotal - lineDiscount;
    const lineTax = isVatRegistered ? roundMoney((taxableAmount * Number(item.tax_rate || 0)) / 100) : 0;
    const lineTotal = roundMoney(taxableAmount + lineTax);
    subtotal = roundMoney(subtotal + lineSubtotal);
    discount = roundMoney(discount + lineDiscount);
    tax = roundMoney(tax + lineTax);
    return { ...item, tax_rate: isVatRegistered ? item.tax_rate : 0, line_subtotal: lineSubtotal, line_discount: lineDiscount, line_tax: lineTax, line_total: lineTotal, sort_order: index };
  });

  const taxableBase = roundMoney(subtotal - discount);
  const grandTotal = roundMoney(taxableBase + tax);
  const withholdingTaxAmount = roundMoney((taxableBase * withholdingTaxRate) / 100);
  const netPayable = roundMoney(grandTotal - withholdingTaxAmount);

  const { data: quotation, error } = await supabase
    .from("sales_quotations")
    .insert({
      company_id: companyId,
      customer_id: text(fd, "customer_id"),
      document_no: documentNo,
      quotation_date: text(fd, "quotation_date"),
      valid_until: text(fd, "valid_until") || null,
      salesperson: text(fd, "salesperson") || null,
      project_name: text(fd, "project_name") || null,
      payment_terms: text(fd, "payment_terms") || null,
      currency_code: text(fd, "currency_code") || "THB",
      notes: text(fd, "notes") || null,
      subtotal,
      discount_amount: discount,
      tax_amount: tax,
      total_amount: netPayable,
      is_vat_registered: isVatRegistered,
      withholding_tax_rate: withholdingTaxRate,
      withholding_tax_amount: withholdingTaxAmount,
      grand_total_amount: grandTotal,
      net_payable_amount: netPayable,
      created_by: user?.id,
    })
    .select("id")
    .single();
  if (error) throw error;

  const { error: itemErr } = await supabase.from("sales_quotation_items").insert(computed.map((item) => ({
    quotation_id: quotation.id,
    product_id: item.product_id || null,
    description: item.description,
    quantity: item.quantity,
    unit_price: item.unit_price,
    discount_percent: item.discount_percent,
    tax_rate: item.tax_rate,
    line_subtotal: item.line_subtotal,
    line_discount: item.line_discount,
    line_tax: item.line_tax,
    line_total: item.line_total,
    sort_order: item.sort_order,
  })));
  if (itemErr) throw itemErr;

  const installments = buildInstallments(netPayable, installmentCount, text(fd, "quotation_date")).map((installment) => ({ quotation_id: quotation.id, ...installment }));
  const { error: installmentErr } = await supabase.from("sales_quotation_installments").insert(installments);
  if (installmentErr) throw installmentErr;

  await supabase.from("sales_quotation_events").insert({ quotation_id: quotation.id, event_type: "CREATED", from_status: null, to_status: "DRAFT", message: "Created quotation", created_by: user?.id });
  revalidatePath("/sales");
  revalidatePath("/sales/quotations");
  redirect(`/sales/quotations/${quotation.id}`);
}

export async function updateQuotationStatus(fd: FormData) {
  const supabase = await createClient();
  const companyId = await getCurrentCompanyId();
  const id = text(fd, "id");
  const status = text(fd, "status");
  const { data: { user } } = await supabase.auth.getUser();
  const { data: current, error: findErr } = await supabase.from("sales_quotations").select("status").eq("id", id).eq("company_id", companyId).single();
  if (findErr) throw findErr;
  const { error } = await supabase.from("sales_quotations").update({ status }).eq("id", id).eq("company_id", companyId);
  if (error) throw error;
  await supabase.from("sales_quotation_events").insert({ quotation_id: id, event_type: "STATUS_CHANGED", from_status: current.status, to_status: status, message: `Changed status from ${current.status} to ${status}`, created_by: user?.id });
  revalidatePath(`/sales/quotations/${id}`);
  revalidatePath("/sales/quotations");
  revalidatePath("/sales");
}

export async function convertQuotationToSalesOrder(fd: FormData) {
  const salesOrderId = await createSalesOrderFromQuotation(parseQuotationToSalesOrderForm(fd));
  revalidatePath("/sales");
  revalidatePath("/sales/quotations");
  revalidatePath("/sales/orders");
  redirect(`/sales/orders/${salesOrderId}`);
}