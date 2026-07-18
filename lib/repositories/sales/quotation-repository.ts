import type { createClient } from "@/lib/supabase/server";
import type { QuotationComputedItem, QuotationInstallmentInput, QuotationTotals } from "@/lib/services/sales/quotation-calculator";
import type { CreateQuotationInput, UpdateQuotationStatusInput } from "@/lib/validation/sales/quotation";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export type QuotationListRow = {
  id: string;
  document_no: string;
  quotation_date: string;
  status: string;
  total_amount: number | string;
  customers: { name: string }[] | null;
};

export type QuotationDetail = QuotationListRow & {
  valid_until: string | null;
  salesperson: string | null;
  project_name: string | null;
  payment_terms: string | null;
  currency_code: string;
  notes: string | null;
  subtotal: number | string;
  discount_amount: number | string;
  tax_amount: number | string;
  customers: { name: string }[] | null;
};

export type QuotationItemRow = {
  id: string;
  description: string;
  quantity: number | string;
  unit_price: number | string;
  line_discount: number | string;
  line_tax: number | string;
  line_total: number | string;
};

export type QuotationEventRow = {
  id: string;
  event_type: string;
  from_status: string | null;
  to_status: string | null;
  message: string | null;
  created_at: string;
};

export class QuotationRepository {
  constructor(private readonly supabase: SupabaseServerClient) {}

  async list(companyId: string) {
    const { data, error } = await this.supabase
      .from("sales_quotations")
      .select("id,document_no,quotation_date,status,total_amount,customers(name)")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data ?? []) as QuotationListRow[];
  }

  async getFormOptions(companyId: string) {
    const [customers, products] = await Promise.all([
      this.supabase.from("customers").select("id,code,name").eq("company_id", companyId).eq("is_active", true).order("name"),
      this.supabase.from("products").select("id,sku,name,selling_price").eq("company_id", companyId).eq("is_active", true).order("name"),
    ]);

    if (customers.error) throw customers.error;
    if (products.error) throw products.error;

    return {
      customers: customers.data ?? [],
      products: (products.data ?? []).map((product) => ({ ...product, selling_price: Number(product.selling_price) })),
    };
  }

  async getById(companyId: string, quotationId: string) {
    const [quotation, items, events] = await Promise.all([
      this.supabase.from("sales_quotations").select("*,customers(name)").eq("id", quotationId).eq("company_id", companyId).maybeSingle(),
      this.supabase.from("sales_quotation_items").select("id,description,quantity,unit_price,line_discount,line_tax,line_total").eq("quotation_id", quotationId).order("sort_order"),
      this.supabase.from("sales_quotation_events").select("id,event_type,from_status,to_status,message,created_at").eq("quotation_id", quotationId).order("created_at", { ascending: false }),
    ]);

    if (quotation.error) throw quotation.error;
    if (items.error) throw items.error;
    if (events.error) throw events.error;

    return {
      quotation: quotation.data as QuotationDetail | null,
      items: (items.data ?? []) as QuotationItemRow[],
      events: (events.data ?? []) as QuotationEventRow[],
    };
  }

  async create(companyId: string, input: CreateQuotationInput, computedItems: QuotationComputedItem[], totals: QuotationTotals, installments: QuotationInstallmentInput[], userId?: string) {
    const { data: documentNo, error: noErr } = await this.supabase.rpc("next_document_number", { p_company_id: companyId, p_document_type: "QUOTATION", p_prefix: "QT" });
    if (noErr) throw noErr;

    const { data: quotation, error } = await this.supabase
      .from("sales_quotations")
      .insert({
        company_id: companyId,
        customer_id: input.customer_id,
        document_no: documentNo,
        quotation_date: input.quotation_date,
        valid_until: input.valid_until,
        salesperson: input.salesperson,
        project_name: input.project_name,
        payment_terms: input.payment_terms,
        currency_code: input.currency_code,
        notes: input.notes,
        subtotal: totals.subtotal,
        discount_amount: totals.discount_amount,
        tax_amount: totals.tax_amount,
        total_amount: totals.total_amount,
        is_vat_registered: input.is_vat_registered,
        withholding_tax_rate: input.withholding_tax_rate,
        withholding_tax_amount: totals.withholding_tax_amount,
        grand_total_amount: totals.grand_total_amount,
        net_payable_amount: totals.net_payable_amount,
        created_by: userId,
      })
      .select("id")
      .single();

    if (error) throw error;

    const { error: itemErr } = await this.supabase.from("sales_quotation_items").insert(computedItems.map((item) => ({
      quotation_id: quotation.id,
      product_id: item.product_id,
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

    const { error: installmentErr } = await this.supabase.from("sales_quotation_installments").insert(installments.map((installment) => ({ quotation_id: quotation.id, ...installment })));
    if (installmentErr) throw installmentErr;

    const { error: eventErr } = await this.supabase.from("sales_quotation_events").insert({ quotation_id: quotation.id, event_type: "CREATED", from_status: null, to_status: "DRAFT", message: "Created quotation", created_by: userId });
    if (eventErr) throw eventErr;

    return String(quotation.id);
  }

  async updateStatus(companyId: string, input: UpdateQuotationStatusInput, userId?: string) {
    const { data: current, error: findErr } = await this.supabase.from("sales_quotations").select("status").eq("id", input.quotation_id).eq("company_id", companyId).single();
    if (findErr) throw findErr;

    const { error } = await this.supabase.from("sales_quotations").update({ status: input.status }).eq("id", input.quotation_id).eq("company_id", companyId);
    if (error) throw error;

    const { error: eventErr } = await this.supabase.from("sales_quotation_events").insert({
      quotation_id: input.quotation_id,
      event_type: "STATUS_CHANGED",
      from_status: current.status,
      to_status: input.status,
      message: `Changed status from ${current.status} to ${input.status}`,
      created_by: userId,
    });
    if (eventErr) throw eventErr;
  }
}
