import type { createClient } from "@/lib/supabase/server";
import type { UpsertDealerTargetInput } from "@/lib/validation/reports/dealer-target";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export type DealerTargetFilters = {
  from?: string;
  to?: string;
};

export type DealerOption = {
  id: string;
  code: string;
  name: string;
};

export type DealerTargetRow = {
  id: string;
  dealer_id: string;
  period_start: string;
  period_end: string;
  target_amount: number | string;
  notes: string | null;
  customers: { code: string; name: string }[] | null;
};

type ApprovedSaleOutRow = {
  dealer_id: string;
  net_amount: number | string;
  customers: { code: string; name: string }[] | null;
};

export type DealerTargetAnalysisLine = {
  dealerId: string;
  dealerCode: string;
  dealerName: string;
  targetAmount: number;
  actualAmount: number;
  varianceAmount: number;
  achievementPercent: number;
  notes: string | null;
};

export type DealerTargetDashboard = {
  filters: Required<Pick<DealerTargetFilters, "from" | "to">>;
  dealers: DealerOption[];
  targets: DealerTargetRow[];
  lines: DealerTargetAnalysisLine[];
  summary: {
    targetAmount: number;
    actualAmount: number;
    varianceAmount: number;
    achievementPercent: number;
    dealerCount: number;
  };
};

export class DealerTargetRepository {
  constructor(private readonly supabase: SupabaseServerClient) {}

  async dashboard(companyId: string, filters: DealerTargetFilters): Promise<DealerTargetDashboard> {
    const normalized = this.normalizeFilters(filters);
    const [dealersResult, targetsResult, saleOutResult] = await Promise.all([
      this.supabase.from("customers").select("id,code,name").eq("company_id", companyId).eq("is_active", true).order("name"),
      this.supabase
        .from("sales_dealer_targets")
        .select("id,dealer_id,period_start,period_end,target_amount,notes,customers(code,name)")
        .eq("company_id", companyId)
        .lte("period_start", normalized.to)
        .gte("period_end", normalized.from)
        .order("period_start", { ascending: false }),
      this.supabase
        .from("sales_out_reports")
        .select("dealer_id,net_amount,customers(code,name)")
        .eq("company_id", companyId)
        .eq("status", "APPROVED")
        .gte("report_date", normalized.from)
        .lte("report_date", normalized.to),
    ]);

    if (dealersResult.error) throw dealersResult.error;
    if (targetsResult.error) throw targetsResult.error;
    if (saleOutResult.error) throw saleOutResult.error;

    const dealers = (dealersResult.data ?? []) as DealerOption[];
    const targets = (targetsResult.data ?? []) as DealerTargetRow[];
    const saleOut = (saleOutResult.data ?? []) as ApprovedSaleOutRow[];
    const lines = this.toAnalysisLines(targets, saleOut);
    const targetAmount = lines.reduce((sum, line) => sum + line.targetAmount, 0);
    const actualAmount = lines.reduce((sum, line) => sum + line.actualAmount, 0);

    return {
      filters: normalized,
      dealers,
      targets,
      lines,
      summary: {
        targetAmount,
        actualAmount,
        varianceAmount: actualAmount - targetAmount,
        achievementPercent: targetAmount > 0 ? (actualAmount / targetAmount) * 100 : 0,
        dealerCount: lines.length,
      },
    };
  }

  async upsertTarget(companyId: string, input: UpsertDealerTargetInput) {
    const { data, error } = await this.supabase.rpc("upsert_sales_dealer_target", {
      p_company_id: companyId,
      p_dealer_id: input.dealer_id,
      p_period_start: input.period_start,
      p_period_end: input.period_end,
      p_target_amount: input.target_amount,
      p_notes: input.notes,
    });

    if (error) throw error;
    return String(data);
  }

  private normalizeFilters(filters: DealerTargetFilters) {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    return {
      from: this.safeDate(filters.from) ?? firstDay.toISOString().slice(0, 10),
      to: this.safeDate(filters.to) ?? today.toISOString().slice(0, 10),
    };
  }

  private safeDate(value: string | undefined) {
    if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
    return value;
  }

  private toAnalysisLines(targets: DealerTargetRow[], saleOut: ApprovedSaleOutRow[]) {
    const actualByDealer = new Map<string, number>();
    for (const report of saleOut) {
      actualByDealer.set(report.dealer_id, (actualByDealer.get(report.dealer_id) ?? 0) + Number(report.net_amount || 0));
    }

    return targets.map((target) => {
      const dealer = target.customers?.[0];
      const targetAmount = Number(target.target_amount || 0);
      const actualAmount = actualByDealer.get(target.dealer_id) ?? 0;
      return {
        dealerId: target.dealer_id,
        dealerCode: dealer?.code ?? "-",
        dealerName: dealer?.name ?? "Dealer",
        targetAmount,
        actualAmount,
        varianceAmount: actualAmount - targetAmount,
        achievementPercent: targetAmount > 0 ? (actualAmount / targetAmount) * 100 : 0,
        notes: target.notes,
      };
    }).sort((left, right) => right.achievementPercent - left.achievementPercent);
  }
}
