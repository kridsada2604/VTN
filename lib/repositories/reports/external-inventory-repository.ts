import type { createClient } from "@/lib/supabase/server";
import type { InventoryExternalComputedItem, InventoryExternalTotals } from "@/lib/services/reports/external-inventory-calculator";
import type { CreateInventoryExternalInput } from "@/lib/validation/reports/external-inventory";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export type ExternalInventoryFilters = {
  periodMonth?: string;
  dealerId?: string;
  q?: string;
};

export type ExternalInventoryReportRow = {
  id: string;
  dealer_id: string;
  period_month: string;
  source_channel: string;
  status: string;
  total_stock_on_hand: number | string;
  total_inbound_qty: number | string;
  total_outbound_qty: number | string;
  total_adjustment_qty: number | string;
  created_at: string;
  customers: { code: string; name: string }[] | null;
};

export type ExternalInventorySummary = {
  totalReports: number;
  stockOnHand: number;
  inboundQty: number;
  outboundQty: number;
  adjustmentQty: number;
  topDealers: Array<{ dealerName: string; stockOnHand: number }>;
};

export type ExternalInventoryPreview = {
  reports: ExternalInventoryReportRow[];
  summary: ExternalInventorySummary;
  filters: Required<Pick<ExternalInventoryFilters, "periodMonth" | "dealerId" | "q">>;
  options: { dealers: Array<{ id: string; code: string; name: string }> };
};

const reportSelect = "id,dealer_id,period_month,source_channel,status,total_stock_on_hand,total_inbound_qty,total_outbound_qty,total_adjustment_qty,created_at,customers(code,name)";

export class ExternalInventoryRepository {
  constructor(private readonly supabase: SupabaseServerClient) {}

  async preview(companyId: string, filters: ExternalInventoryFilters): Promise<ExternalInventoryPreview> {
    const normalized = this.normalizeFilters(filters);
    let query = this.supabase
      .from("external_inventory_reports")
      .select(reportSelect)
      .eq("company_id", companyId)
      .eq("period_month", normalized.periodMonth)
      .order("created_at", { ascending: false });

    if (normalized.dealerId) query = query.eq("dealer_id", normalized.dealerId);

    const [reportsResult, dealersResult] = await Promise.all([
      query,
      this.supabase.from("customers").select("id,code,name").eq("company_id", companyId).eq("is_active", true).order("name"),
    ]);

    if (reportsResult.error) throw reportsResult.error;
    if (dealersResult.error) throw dealersResult.error;

    const reports = this.applyKeywordFilter((reportsResult.data ?? []) as ExternalInventoryReportRow[], normalized.q);

    return {
      reports,
      summary: this.toSummary(reports),
      filters: normalized,
      options: { dealers: dealersResult.data ?? [] },
    };
  }

  async create(companyId: string, input: CreateInventoryExternalInput, computedItems: InventoryExternalComputedItem[], totals: InventoryExternalTotals) {
    const { data, error } = await this.supabase.rpc("create_external_inventory_report", {
      p_company_id: companyId,
      p_dealer_id: input.dealer_id,
      p_period_month: input.period_month,
      p_source_channel: input.source_channel,
      p_notes: input.notes,
      p_items: computedItems,
      p_total_stock_on_hand: totals.total_stock_on_hand,
      p_total_inbound_qty: totals.total_inbound_qty,
      p_total_outbound_qty: totals.total_outbound_qty,
      p_total_adjustment_qty: totals.total_adjustment_qty,
    });

    if (error) throw error;
    return String(data);
  }

  private normalizeFilters(filters: ExternalInventoryFilters) {
    const today = new Date();
    const month = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
    return {
      periodMonth: /^\d{4}-\d{2}$/.test(filters.periodMonth ?? "") ? String(filters.periodMonth) : month,
      dealerId: filters.dealerId?.trim() ?? "",
      q: filters.q?.trim() ?? "",
    };
  }

  private applyKeywordFilter(reports: ExternalInventoryReportRow[], keyword: string) {
    const normalized = keyword.trim().toLowerCase();
    if (!normalized) return reports;
    return reports.filter((report) => {
      const dealer = report.customers?.[0];
      return [report.period_month, report.status, report.source_channel, dealer?.code, dealer?.name]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalized));
    });
  }

  private toSummary(reports: ExternalInventoryReportRow[]): ExternalInventorySummary {
    return {
      totalReports: reports.length,
      stockOnHand: reports.reduce((sum, report) => sum + Number(report.total_stock_on_hand || 0), 0),
      inboundQty: reports.reduce((sum, report) => sum + Number(report.total_inbound_qty || 0), 0),
      outboundQty: reports.reduce((sum, report) => sum + Number(report.total_outbound_qty || 0), 0),
      adjustmentQty: reports.reduce((sum, report) => sum + Number(report.total_adjustment_qty || 0), 0),
      topDealers: this.groupStock(reports),
    };
  }

  private groupStock(reports: ExternalInventoryReportRow[]) {
    const grouped = new Map<string, number>();
    for (const report of reports) {
      const dealerName = report.customers?.[0]?.name ?? "-";
      grouped.set(dealerName, (grouped.get(dealerName) ?? 0) + Number(report.total_stock_on_hand || 0));
    }
    return Array.from(grouped.entries())
      .map(([dealerName, stockOnHand]) => ({ dealerName, stockOnHand }))
      .sort((left, right) => right.stockOnHand - left.stockOnHand)
      .slice(0, 5);
  }
}
