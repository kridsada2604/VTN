import type { createClient } from "@/lib/supabase/server";
import type { MonthOfInventoryComputedItem, MonthOfInventoryTotals } from "@/lib/services/reports/month-of-inventory-calculator";
import type { CreateMonthOfInventoryInput } from "@/lib/validation/reports/month-of-inventory";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export type MonthOfInventoryFilters = { periodMonth?: string; dealerId?: string; q?: string };

export type MonthOfInventoryReportRow = {
  id: string;
  dealer_id: string;
  period_month: string;
  source_channel: string;
  status: string;
  total_stock_on_hand: number | string;
  total_average_monthly_sale_out: number | string;
  average_month_of_inventory: number | string;
  reorder_count: number;
  created_at: string;
  customers: { code: string; name: string }[] | null;
};

export type MonthOfInventoryPreview = {
  reports: MonthOfInventoryReportRow[];
  summary: {
    totalReports: number;
    stockOnHand: number;
    averageMonthlySaleOut: number;
    averageMonthOfInventory: number;
    reorderCount: number;
    lowCoverageDealers: Array<{ dealerName: string; monthOfInventory: number; reorderCount: number }>;
  };
  filters: Required<Pick<MonthOfInventoryFilters, "periodMonth" | "dealerId" | "q">>;
  options: { dealers: Array<{ id: string; code: string; name: string }> };
};

const reportSelect = "id,dealer_id,period_month,source_channel,status,total_stock_on_hand,total_average_monthly_sale_out,average_month_of_inventory,reorder_count,created_at,customers(code,name)";

export class MonthOfInventoryRepository {
  constructor(private readonly supabase: SupabaseServerClient) {}

  async preview(companyId: string, filters: MonthOfInventoryFilters): Promise<MonthOfInventoryPreview> {
    const normalized = this.normalizeFilters(filters);
    let query = this.supabase
      .from("month_of_inventory_reports")
      .select(reportSelect)
      .eq("company_id", companyId)
      .eq("period_month", normalized.periodMonth)
      .order("average_month_of_inventory", { ascending: true });

    if (normalized.dealerId) query = query.eq("dealer_id", normalized.dealerId);

    const [reportsResult, dealersResult] = await Promise.all([
      query,
      this.supabase.from("customers").select("id,code,name").eq("company_id", companyId).eq("is_active", true).order("name"),
    ]);

    if (reportsResult.error) throw reportsResult.error;
    if (dealersResult.error) throw dealersResult.error;

    const reports = this.applyKeywordFilter((reportsResult.data ?? []) as MonthOfInventoryReportRow[], normalized.q);
    return { reports, summary: this.toSummary(reports), filters: normalized, options: { dealers: dealersResult.data ?? [] } };
  }

  async create(companyId: string, input: CreateMonthOfInventoryInput, computedItems: MonthOfInventoryComputedItem[], totals: MonthOfInventoryTotals) {
    const { data, error } = await this.supabase.rpc("create_month_of_inventory_report", {
      p_company_id: companyId,
      p_dealer_id: input.dealer_id,
      p_period_month: input.period_month,
      p_source_channel: input.source_channel,
      p_notes: input.notes,
      p_items: computedItems,
      p_total_stock_on_hand: totals.total_stock_on_hand,
      p_total_average_monthly_sale_out: totals.total_average_monthly_sale_out,
      p_average_month_of_inventory: totals.average_month_of_inventory,
      p_reorder_count: totals.reorder_count,
    });
    if (error) throw error;
    return String(data);
  }

  private normalizeFilters(filters: MonthOfInventoryFilters) {
    const today = new Date();
    const month = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
    return {
      periodMonth: /^\d{4}-\d{2}$/.test(filters.periodMonth ?? "") ? String(filters.periodMonth) : month,
      dealerId: filters.dealerId?.trim() ?? "",
      q: filters.q?.trim() ?? "",
    };
  }

  private applyKeywordFilter(reports: MonthOfInventoryReportRow[], keyword: string) {
    const normalized = keyword.trim().toLowerCase();
    if (!normalized) return reports;
    return reports.filter((report) => {
      const dealer = report.customers?.[0];
      return [report.period_month, report.status, report.source_channel, dealer?.code, dealer?.name]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalized));
    });
  }

  private toSummary(reports: MonthOfInventoryReportRow[]): MonthOfInventoryPreview["summary"] {
    const stockOnHand = reports.reduce((sum, report) => sum + Number(report.total_stock_on_hand || 0), 0);
    const averageMonthlySaleOut = reports.reduce((sum, report) => sum + Number(report.total_average_monthly_sale_out || 0), 0);
    return {
      totalReports: reports.length,
      stockOnHand,
      averageMonthlySaleOut,
      averageMonthOfInventory: averageMonthlySaleOut > 0 ? stockOnHand / averageMonthlySaleOut : 0,
      reorderCount: reports.reduce((sum, report) => sum + Number(report.reorder_count || 0), 0),
      lowCoverageDealers: reports
        .filter((report) => Number(report.average_month_of_inventory || 0) < 1.5 || Number(report.reorder_count || 0) > 0)
        .map((report) => ({ dealerName: report.customers?.[0]?.name ?? "-", monthOfInventory: Number(report.average_month_of_inventory || 0), reorderCount: Number(report.reorder_count || 0) }))
        .slice(0, 5),
    };
  }
}
