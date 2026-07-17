import type { createClient } from "@/lib/supabase/server";
import type { SaleOutComputedItem, SaleOutTotals } from "@/lib/services/sales/sale-out-calculator";
import type { CreateSaleOutInput } from "@/lib/validation/sales/sale-out";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export type SaleOutReportRow = {
  id: string;
  document_no: string;
  report_date: string;
  period_start: string;
  period_end: string;
  source_channel: string;
  status: string;
  gross_amount: number | string;
  discount_amount: number | string;
  net_amount: number | string;
  customers: { code: string; name: string }[] | null;
  profiles: { full_name: string | null; email: string | null }[] | null;
};

export type SaleOutItemRow = {
  id: string;
  dealer_sku: string | null;
  description: string;
  quantity: number | string;
  unit_price: number | string;
  line_discount: number | string;
  line_total: number | string;
  products: { sku: string; name: string }[] | null;
};

export type SaleOutSummary = {
  totalReports: number;
  netAmount: number;
  currentMonthAmount: number;
  previousMonthAmount: number;
  growthPercent: number;
  topDealers: Array<{ dealerName: string; amount: number }>;
  topSalespeople: Array<{ salespersonName: string; amount: number }>;
};

export class SaleOutRepository {
  constructor(private readonly supabase: SupabaseServerClient) {}

  async dashboard(companyId: string) {
    const { data, error } = await this.supabase
      .from("sales_out_reports")
      .select("id,document_no,report_date,period_start,period_end,source_channel,status,gross_amount,discount_amount,net_amount,customers(code,name),profiles(full_name,email)")
      .eq("company_id", companyId)
      .order("report_date", { ascending: false });

    if (error) throw error;
    const reports = (data ?? []) as SaleOutReportRow[];
    return { reports, summary: this.toSummary(reports) };
  }

  async getFormOptions(companyId: string) {
    const [dealers, products, salespeople] = await Promise.all([
      this.supabase.from("customers").select("id,code,name").eq("company_id", companyId).eq("is_active", true).order("name"),
      this.supabase.from("products").select("id,sku,name,selling_price").eq("company_id", companyId).eq("is_active", true).order("name"),
      this.supabase
        .from("company_memberships")
        .select("user_id,profiles(full_name,email)")
        .eq("company_id", companyId)
        .order("created_at", { ascending: true }),
    ]);

    if (dealers.error) throw dealers.error;
    if (products.error) throw products.error;
    if (salespeople.error) throw salespeople.error;

    return {
      dealers: dealers.data ?? [],
      products: (products.data ?? []).map((product) => ({ ...product, selling_price: Number(product.selling_price) })),
      salespeople: salespeople.data ?? [],
    };
  }

  async getById(companyId: string, reportId: string) {
    const [report, items] = await Promise.all([
      this.supabase
        .from("sales_out_reports")
        .select("id,document_no,report_date,period_start,period_end,source_channel,status,gross_amount,discount_amount,net_amount,notes,customers(code,name),profiles(full_name,email)")
        .eq("id", reportId)
        .eq("company_id", companyId)
        .maybeSingle(),
      this.supabase
        .from("sales_out_report_items")
        .select("id,dealer_sku,description,quantity,unit_price,line_discount,line_total,products(sku,name)")
        .eq("report_id", reportId)
        .order("sort_order"),
    ]);

    if (report.error) throw report.error;
    if (items.error) throw items.error;

    return {
      report: report.data as (SaleOutReportRow & { notes: string | null }) | null,
      items: (items.data ?? []) as SaleOutItemRow[],
    };
  }

  async create(companyId: string, input: CreateSaleOutInput, computedItems: SaleOutComputedItem[], totals: SaleOutTotals) {
    const { data, error } = await this.supabase.rpc("create_sales_out_report", {
      p_company_id: companyId,
      p_dealer_id: input.dealer_id,
      p_salesperson_id: input.salesperson_id,
      p_report_date: input.report_date,
      p_period_start: input.period_start,
      p_period_end: input.period_end,
      p_source_channel: input.source_channel,
      p_currency_code: input.currency_code,
      p_notes: input.notes,
      p_items: computedItems,
      p_gross_amount: totals.gross_amount,
      p_discount_amount: totals.discount_amount,
      p_net_amount: totals.net_amount,
    });

    if (error) throw error;
    return String(data);
  }

  private toSummary(reports: SaleOutReportRow[]): SaleOutSummary {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const previousMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousMonth = `${previousMonthDate.getFullYear()}-${String(previousMonthDate.getMonth() + 1).padStart(2, "0")}`;

    const netAmount = reports.reduce((sum, report) => sum + Number(report.net_amount || 0), 0);
    const currentMonthAmount = reports
      .filter((report) => report.report_date.startsWith(currentMonth))
      .reduce((sum, report) => sum + Number(report.net_amount || 0), 0);
    const previousMonthAmount = reports
      .filter((report) => report.report_date.startsWith(previousMonth))
      .reduce((sum, report) => sum + Number(report.net_amount || 0), 0);
    const growthPercent = previousMonthAmount > 0 ? ((currentMonthAmount - previousMonthAmount) / previousMonthAmount) * 100 : 0;

    return {
      totalReports: reports.length,
      netAmount,
      currentMonthAmount,
      previousMonthAmount,
      growthPercent,
      topDealers: this.groupAmounts(reports, (report) => report.customers?.[0]?.name ?? "-"),
      topSalespeople: this.groupAmounts(reports, (report) => report.profiles?.[0]?.full_name ?? report.profiles?.[0]?.email ?? "-"),
    };
  }

  private groupAmounts(reports: SaleOutReportRow[], keyFactory: (report: SaleOutReportRow) => string) {
    const grouped = new Map<string, number>();
    for (const report of reports) {
      const key = keyFactory(report);
      grouped.set(key, (grouped.get(key) ?? 0) + Number(report.net_amount || 0));
    }

    return Array.from(grouped.entries())
      .map(([dealerName, amount]) => ({ dealerName, salespersonName: dealerName, amount }))
      .sort((left, right) => right.amount - left.amount)
      .slice(0, 5);
  }
}
