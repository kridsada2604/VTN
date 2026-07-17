import type { createClient } from "@/lib/supabase/server";
import type { CreateReportUploadInput } from "@/lib/validation/reports/report-center";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export type ReportUploadBatchRow = {
  id: string;
  report_type: string;
  source_name: string;
  period_start: string | null;
  period_end: string | null;
  file_name: string;
  file_size_bytes: number | string | null;
  storage_bucket: string | null;
  storage_path: string | null;
  status: string;
  row_count: number;
  imported_count: number;
  error_count: number;
  created_at: string;
};

export type ReportUploadBatchDetail = ReportUploadBatchRow & {
  company_id: string;
  notes: string | null;
};

export type ReportImportLookup = {
  dealers: Array<{ id: string; code: string; name: string }>;
  products: Array<{ id: string; sku: string; name: string }>;
  salespeople: Array<{ user_id: string; profiles: { full_name: string | null; email: string | null }[] | null }>;
};

export type ReportCenterSummary = {
  uploadCount: number;
  registeredCount: number;
  importedCount: number;
  failedCount: number;
  saleOutAmount: number;
  saleOutGrowthPercent: number;
  inventoryUploadCount: number;
  runrateUploadCount: number;
};

export type ReportCenterCategory = {
  type: "SALE_IN" | "SALE_OUT" | "INVENTORY" | "MOI" | "RUNRATE";
  title: string;
  description: string;
  status: "READY" | "FOUNDATION" | "IN_PROGRESS";
  href: string;
  nextStep: string;
};

export const reportCenterCategories: ReportCenterCategory[] = [
  {
    type: "SALE_IN",
    title: "Sale In",
    description: "Sales from company to dealer or sales channel.",
    status: "IN_PROGRESS",
    href: "/reports/SALE_IN",
    nextStep: "Add Sale In schema, import parser, and dealer purchase analysis.",
  },
  {
    type: "SALE_OUT",
    title: "Sale Out",
    description: "Dealer sell-out to end customers for growth and commission analysis.",
    status: "READY",
    href: "/reports/SALE_OUT",
    nextStep: "Add approval workflow and commission rule engine.",
  },
  {
    type: "INVENTORY",
    title: "Inventory",
    description: "Dealer stock on hand, movement, lot/serial, and external warehouse reports.",
    status: "FOUNDATION",
    href: "/reports/INVENTORY",
    nextStep: "Add storage upload and inventory file parser.",
  },
  {
    type: "MOI",
    title: "MOI",
    description: "Market or industry data for external trend comparison.",
    status: "FOUNDATION",
    href: "/reports/MOI",
    nextStep: "Define MOI dataset template and trend analytics.",
  },
  {
    type: "RUNRATE",
    title: "Runrate",
    description: "Daily, weekly, and monthly average sales for demand forecasting.",
    status: "FOUNDATION",
    href: "/reports/RUNRATE",
    nextStep: "Build runrate import template and forecast calculations.",
  },
];

export class ReportCenterRepository {
  constructor(private readonly supabase: SupabaseServerClient) {}

  async dashboard(companyId: string) {
    const [uploads, saleOutReports] = await Promise.all([
      this.supabase
        .from("report_upload_batches")
        .select("id,report_type,source_name,period_start,period_end,file_name,file_size_bytes,storage_bucket,storage_path,status,row_count,imported_count,error_count,created_at")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false })
        .limit(50),
      this.supabase
        .from("sales_out_reports")
        .select("id,report_date,net_amount")
        .eq("company_id", companyId)
        .order("report_date", { ascending: false }),
    ]);

    if (uploads.error) throw uploads.error;
    if (saleOutReports.error) throw saleOutReports.error;

    const rows = (uploads.data ?? []) as ReportUploadBatchRow[];
    const saleOutRows = (saleOutReports.data ?? []) as Array<{ report_date: string; net_amount: number | string }>;

    return {
      uploads: rows,
      summary: this.toSummary(rows, saleOutRows),
      categories: reportCenterCategories,
    };
  }

  async getCategory(companyId: string, reportType: string) {
    const normalizedType = reportType.toUpperCase();
    const category = reportCenterCategories.find((entry) => entry.type === normalizedType);
    if (!category) return null;

    const { data, error } = await this.supabase
      .from("report_upload_batches")
      .select("id,report_type,source_name,period_start,period_end,file_name,file_size_bytes,storage_bucket,storage_path,status,row_count,imported_count,error_count,created_at")
      .eq("company_id", companyId)
      .eq("report_type", normalizedType)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return {
      category,
      uploads: (data ?? []) as ReportUploadBatchRow[],
    };
  }

  async createUpload(companyId: string, input: CreateReportUploadInput) {
    const { data, error } = await this.supabase.rpc("create_report_upload_batch", {
      p_company_id: companyId,
      p_report_type: input.report_type,
      p_source_name: input.source_name,
      p_period_start: input.period_start,
      p_period_end: input.period_end,
      p_file_name: input.file_name,
      p_file_size_bytes: input.file_size_bytes,
      p_storage_bucket: input.storage_bucket,
      p_storage_path: input.storage_path,
      p_notes: input.notes,
    });

    if (error) throw error;
    return String(data);
  }

  async getUploadBatch(companyId: string, batchId: string) {
    const { data, error } = await this.supabase
      .from("report_upload_batches")
      .select("id,company_id,report_type,source_name,period_start,period_end,file_name,file_size_bytes,storage_bucket,storage_path,status,row_count,imported_count,error_count,notes,created_at")
      .eq("company_id", companyId)
      .eq("id", batchId)
      .maybeSingle();

    if (error) throw error;
    return data as ReportUploadBatchDetail | null;
  }

  async updateUploadBatchStatus(
    companyId: string,
    batchId: string,
    input: { status: "PROCESSING" | "IMPORTED" | "FAILED"; row_count?: number; imported_count?: number; error_count?: number; notes?: string | null },
  ) {
    const { error } = await this.supabase
      .from("report_upload_batches")
      .update({
        status: input.status,
        row_count: input.row_count,
        imported_count: input.imported_count,
        error_count: input.error_count,
        notes: input.notes,
      })
      .eq("company_id", companyId)
      .eq("id", batchId);

    if (error) throw error;
  }

  async getSaleOutImportLookups(companyId: string): Promise<ReportImportLookup> {
    const [dealers, products, salespeople] = await Promise.all([
      this.supabase.from("customers").select("id,code,name").eq("company_id", companyId).eq("is_active", true),
      this.supabase.from("products").select("id,sku,name").eq("company_id", companyId).eq("is_active", true),
      this.supabase.from("company_memberships").select("user_id,profiles(full_name,email)").eq("company_id", companyId),
    ]);

    if (dealers.error) throw dealers.error;
    if (products.error) throw products.error;
    if (salespeople.error) throw salespeople.error;

    return {
      dealers: dealers.data ?? [],
      products: products.data ?? [],
      salespeople: salespeople.data ?? [],
    };
  }

  private toSummary(uploads: ReportUploadBatchRow[], saleOutReports: Array<{ report_date: string; net_amount: number | string }>): ReportCenterSummary {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const previousMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousMonth = `${previousMonthDate.getFullYear()}-${String(previousMonthDate.getMonth() + 1).padStart(2, "0")}`;
    const currentSaleOut = saleOutReports.filter((row) => row.report_date.startsWith(currentMonth)).reduce((sum, row) => sum + Number(row.net_amount || 0), 0);
    const previousSaleOut = saleOutReports.filter((row) => row.report_date.startsWith(previousMonth)).reduce((sum, row) => sum + Number(row.net_amount || 0), 0);

    return {
      uploadCount: uploads.length,
      registeredCount: uploads.filter((row) => row.status === "REGISTERED").length,
      importedCount: uploads.filter((row) => row.status === "IMPORTED").length,
      failedCount: uploads.filter((row) => row.status === "FAILED").length,
      saleOutAmount: saleOutReports.reduce((sum, row) => sum + Number(row.net_amount || 0), 0),
      saleOutGrowthPercent: previousSaleOut > 0 ? ((currentSaleOut - previousSaleOut) / previousSaleOut) * 100 : 0,
      inventoryUploadCount: uploads.filter((row) => row.report_type === "INVENTORY").length,
      runrateUploadCount: uploads.filter((row) => row.report_type === "RUNRATE").length,
    };
  }
}
