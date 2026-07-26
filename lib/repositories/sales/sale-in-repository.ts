import type { createClient } from "@/lib/supabase/server";
import type { SaleInComputedItem, SaleInTotals } from "@/lib/services/sales/sale-in-calculator";
import type { CreateSaleInInput } from "@/lib/validation/sales/sale-in";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export type SaleInReportFilters = {
  from?: string;
  to?: string;
  dealerId?: string;
  q?: string;
};

export type SaleInReportRow = {
  id: string;
  dealer_id: string;
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
};

export type SaleInSummary = {
  totalReports: number;
  netAmount: number;
  currentMonthAmount: number;
  previousMonthAmount: number;
  growthPercent: number;
  topDealers: Array<{ dealerName: string; amount: number }>;
};

export type SaleInReportPreview = {
  reports: SaleInReportRow[];
  summary: SaleInSummary;
  filters: Required<Pick<SaleInReportFilters, "from" | "to" | "dealerId" | "q">>;
  options: {
    dealers: Array<{ id: string; code: string; name: string }>;
  };
};

const reportSelect = "id,dealer_id,document_no,report_date,period_start,period_end,source_channel,status,gross_amount,discount_amount,net_amount,customers(code,name)";

export class SaleInRepository {
  constructor(private readonly supabase: SupabaseServerClient) {}

  async reportPreview(companyId: string, filters: SaleInReportFilters): Promise<SaleInReportPreview> {
    const normalized = this.normalizeFilters(filters);
    let query = this.supabase
      .from("sales_in_reports")
      .select(reportSelect)
      .eq("company_id", companyId)
      .gte("report_date", normalized.from)
      .lte("report_date", normalized.to)
      .order("report_date", { ascending: false })
      .order("document_no", { ascending: false });

    if (normalized.dealerId) query = query.eq("dealer_id", normalized.dealerId);

    const [reportsResult, dealersResult] = await Promise.all([
      query,
      this.supabase.from("customers").select("id,code,name").eq("company_id", companyId).eq("is_active", true).order("name"),
    ]);

    if (reportsResult.error) throw reportsResult.error;
    if (dealersResult.error) throw dealersResult.error;

    const reports = this.applyKeywordFilter((reportsResult.data ?? []) as SaleInReportRow[], normalized.q);

    return {
      reports,
      summary: this.toSummary(reports),
      filters: normalized,
      options: { dealers: dealersResult.data ?? [] },
    };
  }

  async create(companyId: string, input: CreateSaleInInput, computedItems: SaleInComputedItem[], totals: SaleInTotals) {
    const { data, error } = await this.supabase.rpc("create_sales_in_report", {
      p_company_id: companyId,
      p_dealer_id: input.dealer_id,
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

  private normalizeFilters(filters: SaleInReportFilters) {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    return {
      from: this.safeDate(filters.from) ?? firstDay.toISOString().slice(0, 10),
      to: this.safeDate(filters.to) ?? today.toISOString().slice(0, 10),
      dealerId: filters.dealerId?.trim() ?? "",
      q: filters.q?.trim() ?? "",
    };
  }

  private safeDate(value: string | undefined) {
    if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
    return value;
  }

  private applyKeywordFilter(reports: SaleInReportRow[], keyword: string) {
    const normalized = keyword.trim().toLowerCase();
    if (!normalized) return reports;
    return reports.filter((report) => {
      const dealer = report.customers?.[0];
      return [report.document_no, report.status, report.source_channel, dealer?.code, dealer?.name]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalized));
    });
  }

  private toSummary(reports: SaleInReportRow[]): SaleInSummary {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const previousMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousMonth = `${previousMonthDate.getFullYear()}-${String(previousMonthDate.getMonth() + 1).padStart(2, "0")}`;
    const netAmount = reports.reduce((sum, report) => sum + Number(report.net_amount || 0), 0);
    const currentMonthAmount = reports.filter((report) => report.report_date.startsWith(currentMonth)).reduce((sum, report) => sum + Number(report.net_amount || 0), 0);
    const previousMonthAmount = reports.filter((report) => report.report_date.startsWith(previousMonth)).reduce((sum, report) => sum + Number(report.net_amount || 0), 0);

    return {
      totalReports: reports.length,
      netAmount,
      currentMonthAmount,
      previousMonthAmount,
      growthPercent: previousMonthAmount > 0 ? ((currentMonthAmount - previousMonthAmount) / previousMonthAmount) * 100 : 0,
      topDealers: this.groupAmounts(reports, (report) => report.customers?.[0]?.name ?? "-"),
    };
  }

  private groupAmounts(reports: SaleInReportRow[], keyFactory: (report: SaleInReportRow) => string) {
    const grouped = new Map<string, number>();
    for (const report of reports) {
      const key = keyFactory(report);
      grouped.set(key, (grouped.get(key) ?? 0) + Number(report.net_amount || 0));
    }
    return Array.from(grouped.entries())
      .map(([dealerName, amount]) => ({ dealerName, amount }))
      .sort((left, right) => right.amount - left.amount)
      .slice(0, 5);
  }
}
