import type { createClient } from "@/lib/supabase/server";
import type { CreateCommissionRuleInput, CreateCommissionRunInput } from "@/lib/validation/reports/commission";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export type CommissionFilters = {
  from?: string;
  to?: string;
};

export type CommissionRuleRow = {
  id: string;
  name: string;
  basis: "SALE_OUT_NET" | "SALE_OUT_GROSS";
  rate_percent: number | string;
  minimum_base_amount: number | string;
  is_active: boolean;
  effective_from: string | null;
  effective_to: string | null;
  created_at: string;
};

export type CommissionRunRow = {
  id: string;
  rule_id: string;
  period_start: string;
  period_end: string;
  status: string;
  total_base_amount: number | string;
  total_commission_amount: number | string;
  created_at: string;
  sales_commission_rules: { name: string; rate_percent: number | string; basis: string }[] | null;
};

type ApprovedSaleOutRow = {
  id: string;
  document_no: string;
  report_date: string;
  dealer_id: string;
  salesperson_id: string;
  gross_amount: number | string;
  net_amount: number | string;
  customers: { code: string; name: string }[] | null;
  profiles: { full_name: string | null; email: string | null }[] | null;
};

export type CommissionPreviewLine = {
  salespersonId: string;
  salespersonName: string;
  reportCount: number;
  baseAmount: number;
  commissionAmount: number;
};

export type CommissionDashboard = {
  filters: Required<Pick<CommissionFilters, "from" | "to">>;
  rules: CommissionRuleRow[];
  runs: CommissionRunRow[];
  preview: {
    activeRule: CommissionRuleRow | null;
    approvedReportCount: number;
    baseAmount: number;
    commissionAmount: number;
    lines: CommissionPreviewLine[];
  };
};

export class CommissionRepository {
  constructor(private readonly supabase: SupabaseServerClient) {}

  async dashboard(companyId: string, filters: CommissionFilters): Promise<CommissionDashboard> {
    const normalized = this.normalizeFilters(filters);
    const [rulesResult, runsResult, saleOutResult] = await Promise.all([
      this.supabase
        .from("sales_commission_rules")
        .select("id,name,basis,rate_percent,minimum_base_amount,is_active,effective_from,effective_to,created_at")
        .eq("company_id", companyId)
        .order("is_active", { ascending: false })
        .order("created_at", { ascending: false }),
      this.supabase
        .from("sales_commission_runs")
        .select("id,rule_id,period_start,period_end,status,total_base_amount,total_commission_amount,created_at,sales_commission_rules(name,rate_percent,basis)")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false })
        .limit(20),
      this.supabase
        .from("sales_out_reports")
        .select("id,document_no,report_date,dealer_id,salesperson_id,gross_amount,net_amount,customers(code,name),profiles(full_name,email)")
        .eq("company_id", companyId)
        .eq("status", "APPROVED")
        .not("salesperson_id", "is", null)
        .gte("report_date", normalized.from)
        .lte("report_date", normalized.to)
        .order("report_date", { ascending: false }),
    ]);

    if (rulesResult.error) throw rulesResult.error;
    if (runsResult.error) throw runsResult.error;
    if (saleOutResult.error) throw saleOutResult.error;

    const rules = (rulesResult.data ?? []) as CommissionRuleRow[];
    const reports = (saleOutResult.data ?? []) as ApprovedSaleOutRow[];
    const activeRule = this.pickActiveRule(rules, normalized.from, normalized.to);

    return {
      filters: normalized,
      rules,
      runs: (runsResult.data ?? []) as CommissionRunRow[],
      preview: this.toPreview(activeRule, reports),
    };
  }

  async createRule(companyId: string, input: CreateCommissionRuleInput) {
    const { data, error } = await this.supabase.rpc("create_sales_commission_rule", {
      p_company_id: companyId,
      p_name: input.name,
      p_basis: input.basis,
      p_rate_percent: input.rate_percent,
      p_minimum_base_amount: input.minimum_base_amount,
      p_effective_from: input.effective_from,
      p_effective_to: input.effective_to,
    });

    if (error) throw error;
    return String(data);
  }

  async createRun(companyId: string, input: CreateCommissionRunInput) {
    const { data, error } = await this.supabase.rpc("create_sales_commission_run", {
      p_company_id: companyId,
      p_rule_id: input.rule_id,
      p_period_start: input.period_start,
      p_period_end: input.period_end,
    });

    if (error) throw error;
    return String(data);
  }

  private normalizeFilters(filters: CommissionFilters) {
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

  private pickActiveRule(rules: CommissionRuleRow[], from: string, to: string) {
    return rules.find((rule) => {
      if (!rule.is_active) return false;
      if (rule.effective_from && rule.effective_from > to) return false;
      if (rule.effective_to && rule.effective_to < from) return false;
      return true;
    }) ?? null;
  }

  private roundMoney(value: number) {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }

  private toPreview(rule: CommissionRuleRow | null, reports: ApprovedSaleOutRow[]) {
    if (!rule) {
      return { activeRule: null, approvedReportCount: reports.length, baseAmount: 0, commissionAmount: 0, lines: [] };
    }

    const grouped = new Map<string, CommissionPreviewLine>();
    const rate = Number(rule.rate_percent || 0);
    const minimum = Number(rule.minimum_base_amount || 0);

    for (const report of reports) {
      const base = rule.basis === "SALE_OUT_GROSS" ? Number(report.gross_amount || 0) : Number(report.net_amount || 0);
      if (base < minimum) continue;

      const salesperson = report.profiles?.[0];
      const key = report.salesperson_id;
      const current = grouped.get(key) ?? {
        salespersonId: key,
        salespersonName: salesperson?.full_name ?? salesperson?.email ?? "Unassigned",
        reportCount: 0,
        baseAmount: 0,
        commissionAmount: 0,
      };
      current.reportCount += 1;
      current.baseAmount += base;
      current.commissionAmount += this.roundMoney((base * rate) / 100);
      grouped.set(key, current);
    }

    const lines = Array.from(grouped.values()).sort((left, right) => right.commissionAmount - left.commissionAmount);
    return {
      activeRule: rule,
      approvedReportCount: reports.length,
      baseAmount: lines.reduce((sum, line) => sum + line.baseAmount, 0),
      commissionAmount: lines.reduce((sum, line) => sum + line.commissionAmount, 0),
      lines,
    };
  }
}

