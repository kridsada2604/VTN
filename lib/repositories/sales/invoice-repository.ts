import type { createClient } from "@/lib/supabase/server";
import type { CreateInvoiceInput, ReceivePaymentInput } from "@/lib/validation/sales/invoice";
import type { InvoiceComputedItem, InvoiceTotals } from "@/lib/services/sales/invoice-calculator";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export type InvoiceListRow = {
  id: string;
  document_no: string;
  invoice_date: string;
  due_date: string | null;
  status: string;
  total_amount: number | string;
  paid_amount: number | string;
  balance_amount: number | string;
  customers: { name: string }[] | null;
};

export type InvoiceDetail = {
  id: string;
  company_id: string;
  customer_id: string;
  document_no: string;
  invoice_date: string;
  due_date: string | null;
  status: string;
  payment_terms: string | null;
  currency_code: string;
  notes: string | null;
  subtotal: number | string;
  discount_amount: number | string;
  tax_amount: number | string;
  total_amount: number | string;
  paid_amount: number | string;
  balance_amount: number | string;
  journal_entry_id: string | null;
  customers: {
    name: string;
    code: string;
    tax_id: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
  }[] | null;
};

export type InvoiceItemRow = {
  id: string;
  description: string;
  quantity: number | string;
  unit_price: number | string;
  line_discount: number | string;
  line_tax: number | string;
  line_total: number | string;
};

export type InvoiceInstallmentRow = {
  id: string;
  installment_no: number;
  due_date: string | null;
  description: string | null;
  percent: number | string;
  amount: number | string;
  paid_amount: number | string;
  status: string;
};

export type InvoicePaymentRow = {
  id: string;
  payment_no: string;
  payment_date: string;
  method: string;
  amount: number | string;
  reference_no: string | null;
  notes: string | null;
  journal_entry_id: string | null;
};

export type InvoiceEventRow = {
  id: string;
  event_type: string;
  message: string | null;
  created_at: string;
};

export type DocumentEmailLogRow = {
  id: string;
  recipient_email: string;
  subject: string;
  provider: string;
  status: string;
  provider_message_id: string | null;
  error_message: string | null;
  sent_at: string | null;
  created_at: string;
};

export class InvoiceRepository {
  constructor(private readonly supabase: SupabaseServerClient) {}

  async list(companyId: string) {
    const { data, error } = await this.supabase
      .from("sales_invoices")
      .select("id,document_no,invoice_date,due_date,status,total_amount,paid_amount,balance_amount,customers(name)")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data ?? []) as InvoiceListRow[];
  }

  async getFormOptions(companyId: string) {
    const [customers, products] = await Promise.all([
      this.supabase
        .from("customers")
        .select("id,code,name")
        .eq("company_id", companyId)
        .eq("is_active", true)
        .order("name"),
      this.supabase
        .from("products")
        .select("id,sku,name,selling_price")
        .eq("company_id", companyId)
        .eq("is_active", true)
        .order("name"),
    ]);

    if (customers.error) throw customers.error;
    if (products.error) throw products.error;

    return {
      customers: customers.data ?? [],
      products: (products.data ?? []).map((product) => ({
        ...product,
        selling_price: Number(product.selling_price),
      })),
    };
  }

  async getById(companyId: string, invoiceId: string) {
    const [invoice, items, installments, payments, events, emailLogs] = await Promise.all([
      this.supabase
        .from("sales_invoices")
        .select("*,customers(code,name,tax_id,email,phone,address)")
        .eq("id", invoiceId)
        .eq("company_id", companyId)
        .maybeSingle(),
      this.supabase
        .from("sales_invoice_items")
        .select("id,description,quantity,unit_price,line_discount,line_tax,line_total")
        .eq("invoice_id", invoiceId)
        .order("sort_order"),
      this.supabase
        .from("sales_invoice_installments")
        .select("id,installment_no,due_date,description,percent,amount,paid_amount,status")
        .eq("invoice_id", invoiceId)
        .order("installment_no"),
      this.supabase
        .from("sales_invoice_payments")
        .select("id,payment_no,payment_date,method,amount,reference_no,notes,journal_entry_id")
        .eq("invoice_id", invoiceId)
        .order("payment_date", { ascending: false }),
      this.supabase
        .from("sales_invoice_events")
        .select("id,event_type,message,created_at")
        .eq("invoice_id", invoiceId)
        .order("created_at", { ascending: false }),
      this.supabase
        .from("document_email_logs")
        .select("id,recipient_email,subject,provider,status,provider_message_id,error_message,sent_at,created_at")
        .eq("company_id", companyId)
        .eq("document_type", "SALES_INVOICE")
        .eq("document_id", invoiceId)
        .order("created_at", { ascending: false }),
    ]);

    if (invoice.error) throw invoice.error;
    if (items.error) throw items.error;
    if (installments.error) throw installments.error;
    if (payments.error) throw payments.error;
    if (events.error) throw events.error;
    if (emailLogs.error) throw emailLogs.error;

    return {
      invoice: invoice.data as InvoiceDetail | null,
      items: (items.data ?? []) as InvoiceItemRow[],
      installments: (installments.data ?? []) as InvoiceInstallmentRow[],
      payments: (payments.data ?? []) as InvoicePaymentRow[],
      events: (events.data ?? []) as InvoiceEventRow[],
      emailLogs: (emailLogs.data ?? []) as DocumentEmailLogRow[],
    };
  }

  async create(
    companyId: string,
    input: CreateInvoiceInput,
    computedItems: InvoiceComputedItem[],
    totals: InvoiceTotals,
  ) {
    const { data, error } = await this.supabase.rpc("create_sales_invoice", {
      p_company_id: companyId,
      p_customer_id: input.customer_id,
      p_invoice_date: input.invoice_date,
      p_due_date: input.due_date,
      p_payment_terms: input.payment_terms,
      p_currency_code: input.currency_code,
      p_notes: input.notes,
      p_items: computedItems,
      p_subtotal: totals.subtotal,
      p_discount_amount: totals.discount_amount,
      p_tax_amount: totals.tax_amount,
      p_total_amount: totals.total_amount,
    });

    if (error) throw error;
    return String(data);
  }


  private async applyTaxAndInstallments(companyId: string, invoiceId: string, input: CreateInvoiceInput, totals: InvoiceTotals) {
    const { error: updateError } = await this.supabase
      .from("sales_invoices")
      .update({
        is_vat_registered: input.is_vat_registered,
        withholding_tax_rate: input.withholding_tax_rate,
        withholding_tax_amount: totals.withholding_tax_amount,
        grand_total_amount: totals.grand_total_amount,
        net_payable_amount: totals.total_amount,
        total_amount: totals.total_amount,
        balance_amount: totals.total_amount,
      })
      .eq("company_id", companyId)
      .eq("id", invoiceId);

    if (updateError) throw updateError;

    const installments = this.buildInstallments(invoiceId, totals.total_amount, input.installment_count, input.due_date ?? input.invoice_date);
    const { error: installmentError } = await this.supabase.from("sales_invoice_installments").insert(installments);
    if (installmentError) throw installmentError;
  }

  private buildInstallments(invoiceId: string, totalAmount: number, count: number, startDate: string) {
    const safeCount = Math.min(Math.max(Math.trunc(count || 1), 1), 24);
    const roundMoney = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;
    const baseAmount = roundMoney(totalAmount / safeCount);
    let assigned = 0;
    return Array.from({ length: safeCount }, (_, index) => {
      const installmentNo = index + 1;
      const dueDate = new Date(`${startDate}T00:00:00`);
      dueDate.setMonth(dueDate.getMonth() + index);
      const amount = installmentNo === safeCount ? roundMoney(totalAmount - assigned) : baseAmount;
      assigned = roundMoney(assigned + amount);
      return {
        invoice_id: invoiceId,
        installment_no: installmentNo,
        due_date: dueDate.toISOString().slice(0, 10),
        description: `Installment ${installmentNo}/${safeCount}`,
        percent: roundMoney(100 / safeCount),
        amount,
      };
    });
  }
  async receivePayment(companyId: string, input: ReceivePaymentInput) {
    const { data, error } = await this.supabase.rpc("receive_invoice_payment", {
      p_company_id: companyId,
      p_invoice_id: input.invoice_id,
      p_payment_date: input.payment_date,
      p_method: input.method,
      p_amount: input.amount,
      p_reference_no: input.reference_no,
      p_notes: input.notes,
    });

    if (error) throw error;
    return String(data);
  }

  async postInvoiceToAccounting(companyId: string, invoiceId: string) {
    const { data, error } = await this.supabase.rpc("post_sales_invoice_to_accounting", {
      p_company_id: companyId,
      p_invoice_id: invoiceId,
    });

    if (error) throw error;
    return String(data);
  }

  async postPaymentToAccounting(companyId: string, paymentId: string) {
    const { data, error } = await this.supabase.rpc("post_invoice_payment_to_accounting", {
      p_company_id: companyId,
      p_payment_id: paymentId,
    });

    if (error) throw error;
    return String(data);
  }

  async sendEmail(invoiceId: string) {
    const { error } = await this.supabase.functions.invoke("invoice-email", {
      body: { invoice_id: invoiceId },
    });

    if (error) throw error;
    return invoiceId;
  }
}
