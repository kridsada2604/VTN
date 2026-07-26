import { getCurrentCompanyId } from "@/lib/current-company";
import { ReportCenterRepository } from "@/lib/repositories/reports/report-center-repository";
import { ExternalInventoryRepository } from "@/lib/repositories/reports/external-inventory-repository";
import { SaleInRepository } from "@/lib/repositories/sales/sale-in-repository";
import { SaleOutRepository } from "@/lib/repositories/sales/sale-out-repository";
import { createClient } from "@/lib/supabase/server";
import { computeExternalInventoryItems } from "@/lib/services/reports/external-inventory-calculator";
import { computeSaleInItems } from "@/lib/services/sales/sale-in-calculator";
import { computeSaleOutItems } from "@/lib/services/sales/sale-out-calculator";
import { findDealerId, findSalespersonId, numberFromRow, parseCsv } from "./csv";
import type { CreateInventoryExternalInput, InventoryExternalItemInput } from "@/lib/validation/reports/external-inventory";
import type { CreateReportUploadInput, CreateReportUploadWithFileInput } from "@/lib/validation/reports/report-center";
import type { CreateSaleInInput, SaleInItemInput } from "@/lib/validation/sales/sale-in";
import type { CreateSaleOutInput, SaleOutItemInput } from "@/lib/validation/sales/sale-out";

const REPORT_IMPORT_BUCKET = "report-imports";

function safeFileName(fileName: string) {
  return fileName
    .normalize("NFKD")
    .replace(/[^\w.\-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 140) || "report-file";
}

function ensureCsvUpload(fileName: string, reportName: string) {
  if (!fileName.toLowerCase().endsWith(".csv")) throw new Error(`${reportName} importer currently supports CSV files only`);
}

export async function getReportCenterDashboard() {
  const supabase = await createClient();
  const companyId = await getCurrentCompanyId();
  return new ReportCenterRepository(supabase).dashboard(companyId);
}

export async function createReportUpload(input: CreateReportUploadInput) {
  const supabase = await createClient();
  const companyId = await getCurrentCompanyId();
  return new ReportCenterRepository(supabase).createUpload(companyId, input);
}

export async function uploadReportFile(input: CreateReportUploadWithFileInput) {
  const supabase = await createClient();
  const companyId = await getCurrentCompanyId();
  const safeName = safeFileName(input.file.name);
  const periodFolder = input.metadata.period_start?.slice(0, 7) ?? new Date().toISOString().slice(0, 7);
  const storagePath = `${companyId}/${input.metadata.report_type.toLowerCase()}/${periodFolder}/${crypto.randomUUID()}-${safeName}`;

  const { error: uploadError } = await supabase.storage.from(REPORT_IMPORT_BUCKET).upload(storagePath, input.file, {
    contentType: input.file.type || "application/octet-stream",
    upsert: false,
  });

  if (uploadError) throw uploadError;

  return new ReportCenterRepository(supabase).createUpload(companyId, {
    ...input.metadata,
    file_name: input.file.name,
    file_size_bytes: input.file.size,
    storage_bucket: REPORT_IMPORT_BUCKET,
    storage_path: storagePath,
  });
}

export async function getReportCenterCategory(reportType: string) {
  const supabase = await createClient();
  const companyId = await getCurrentCompanyId();
  return new ReportCenterRepository(supabase).getCategory(companyId, reportType);
}

export async function importSaleOutUpload(batchId: string) {
  const supabase = await createClient();
  const companyId = await getCurrentCompanyId();
  const reportRepository = new ReportCenterRepository(supabase);
  const saleOutRepository = new SaleOutRepository(supabase);
  const batch = await reportRepository.getUploadBatch(companyId, batchId);

  if (!batch) throw new Error("Report upload batch not found");
  if (batch.report_type !== "SALE_OUT") throw new Error("Only Sale Out upload can be imported by this action");
  if (!batch.storage_bucket || !batch.storage_path) throw new Error("Uploaded file is required before import");

  try {
    ensureCsvUpload(batch.file_name, "Sale Out");
  } catch (error) {
    await reportRepository.updateUploadBatchStatus(companyId, batchId, { status: "FAILED", row_count: 0, imported_count: 0, error_count: 1, notes: error instanceof Error ? error.message : "Invalid Sale Out file" });
    throw error;
  }

  await reportRepository.updateUploadBatchStatus(companyId, batchId, { status: "PROCESSING", notes: batch.notes });

  try {
    const { data, error } = await supabase.storage.from(batch.storage_bucket).download(batch.storage_path);
    if (error) throw error;

    const csvRows = parseCsv(await data.text());
    if (!csvRows.length) throw new Error("CSV file has no data rows");

    const lookups = await reportRepository.getSaleOutImportLookups(companyId);
    const dealerId = findDealerId(batch.source_name, csvRows[0].dealer_code, lookups.dealers);
    if (!dealerId) throw new Error(`Dealer not found for source "${batch.source_name}"`);

    const productBySku = new Map(lookups.products.map((product) => [product.sku.toLowerCase(), product]));
    const items: SaleOutItemInput[] = csvRows.map((row) => {
      const productSku = row.product_sku?.toLowerCase();
      const product = productSku ? productBySku.get(productSku) : null;
      return {
        product_id: product?.id ?? null,
        dealer_sku: row.dealer_sku || row.product_sku || null,
        description: row.description || product?.name || row.product_sku || "Sale Out item",
        quantity: numberFromRow(row, "quantity"),
        unit_price: numberFromRow(row, "unit_price"),
        line_discount: numberFromRow(row, "line_discount"),
      };
    });

    const reportDate = csvRows[0].report_date || batch.period_end || new Date().toISOString().slice(0, 10);
    const saleOutInput: CreateSaleOutInput = {
      dealer_id: dealerId,
      salesperson_id: findSalespersonId(csvRows[0].salesperson_email, lookups.salespeople),
      report_date: reportDate,
      period_start: batch.period_start ?? reportDate,
      period_end: batch.period_end ?? reportDate,
      source_channel: "DEALER",
      currency_code: "THB",
      notes: `Imported from report batch ${batch.file_name}`,
      items,
    };

    const { computedItems, totals } = computeSaleOutItems(saleOutInput.items);
    await saleOutRepository.create(companyId, saleOutInput, computedItems, totals);
    await reportRepository.updateUploadBatchStatus(companyId, batchId, {
      status: "IMPORTED",
      row_count: csvRows.length,
      imported_count: csvRows.length,
      error_count: 0,
      notes: `Imported ${csvRows.length} Sale Out row(s).`,
    });
  } catch (error) {
    await reportRepository.updateUploadBatchStatus(companyId, batchId, {
      status: "FAILED",
      row_count: 0,
      imported_count: 0,
      error_count: 1,
      notes: error instanceof Error ? error.message : "Unknown Sale Out import error",
    });
    throw error;
  }
}

export async function importSaleInUpload(batchId: string) {
  const supabase = await createClient();
  const companyId = await getCurrentCompanyId();
  const reportRepository = new ReportCenterRepository(supabase);
  const saleInRepository = new SaleInRepository(supabase);
  const batch = await reportRepository.getUploadBatch(companyId, batchId);

  if (!batch) throw new Error("Report upload batch not found");
  if (batch.report_type !== "SALE_IN") throw new Error("Only Sale In upload can be imported by this action");
  if (!batch.storage_bucket || !batch.storage_path) throw new Error("Uploaded file is required before import");

  try {
    ensureCsvUpload(batch.file_name, "Sale In");
  } catch (error) {
    await reportRepository.updateUploadBatchStatus(companyId, batchId, { status: "FAILED", row_count: 0, imported_count: 0, error_count: 1, notes: error instanceof Error ? error.message : "Invalid Sale In file" });
    throw error;
  }

  await reportRepository.updateUploadBatchStatus(companyId, batchId, { status: "PROCESSING", notes: batch.notes });

  try {
    const { data, error } = await supabase.storage.from(batch.storage_bucket).download(batch.storage_path);
    if (error) throw error;

    const csvRows = parseCsv(await data.text());
    if (!csvRows.length) throw new Error("CSV file has no data rows");

    const lookups = await reportRepository.getSaleOutImportLookups(companyId);
    const dealerId = findDealerId(batch.source_name, csvRows[0].dealer_code, lookups.dealers);
    if (!dealerId) throw new Error(`Dealer not found for source "${batch.source_name}"`);

    const productBySku = new Map(lookups.products.map((product) => [product.sku.toLowerCase(), product]));
    const items: SaleInItemInput[] = csvRows.map((row) => {
      const productSku = row.product_sku?.toLowerCase();
      const product = productSku ? productBySku.get(productSku) : null;
      return {
        product_id: product?.id ?? null,
        dealer_sku: row.dealer_sku || row.product_sku || null,
        description: row.description || product?.name || row.product_sku || "Sale In item",
        quantity: numberFromRow(row, "quantity"),
        unit_price: numberFromRow(row, "unit_price"),
        line_discount: numberFromRow(row, "line_discount"),
      };
    });

    const reportDate = csvRows[0].report_date || batch.period_end || new Date().toISOString().slice(0, 10);
    const saleInInput: CreateSaleInInput = {
      dealer_id: dealerId,
      report_date: reportDate,
      period_start: batch.period_start ?? reportDate,
      period_end: batch.period_end ?? reportDate,
      source_channel: "CSV",
      currency_code: "THB",
      notes: `Imported from report batch ${batch.file_name}`,
      items,
    };

    const { computedItems, totals } = computeSaleInItems(saleInInput.items);
    await saleInRepository.create(companyId, saleInInput, computedItems, totals);
    await reportRepository.updateUploadBatchStatus(companyId, batchId, {
      status: "IMPORTED",
      row_count: csvRows.length,
      imported_count: csvRows.length,
      error_count: 0,
      notes: `Imported ${csvRows.length} Sale In row(s).`,
    });
  } catch (error) {
    await reportRepository.updateUploadBatchStatus(companyId, batchId, {
      status: "FAILED",
      row_count: 0,
      imported_count: 0,
      error_count: 1,
      notes: error instanceof Error ? error.message : "Unknown Sale In import error",
    });
    throw error;
  }
}


export async function importInventoryUpload(batchId: string) {
  const supabase = await createClient();
  const companyId = await getCurrentCompanyId();
  const reportRepository = new ReportCenterRepository(supabase);
  const inventoryRepository = new ExternalInventoryRepository(supabase);
  const batch = await reportRepository.getUploadBatch(companyId, batchId);

  if (!batch) throw new Error("Report upload batch not found");
  if (batch.report_type !== "INVENTORY") throw new Error("Only Inventory upload can be imported by this action");
  if (!batch.storage_bucket || !batch.storage_path) throw new Error("Uploaded file is required before import");

  try {
    ensureCsvUpload(batch.file_name, "Inventory");
  } catch (error) {
    await reportRepository.updateUploadBatchStatus(companyId, batchId, { status: "FAILED", row_count: 0, imported_count: 0, error_count: 1, notes: error instanceof Error ? error.message : "Invalid Inventory file" });
    throw error;
  }

  await reportRepository.updateUploadBatchStatus(companyId, batchId, { status: "PROCESSING", notes: batch.notes });

  try {
    const { data, error } = await supabase.storage.from(batch.storage_bucket).download(batch.storage_path);
    if (error) throw error;

    const csvRows = parseCsv(await data.text());
    if (!csvRows.length) throw new Error("CSV file has no data rows");

    const lookups = await reportRepository.getSaleOutImportLookups(companyId);
    const dealerId = findDealerId(batch.source_name, csvRows[0].dealer_code, lookups.dealers);
    if (!dealerId) throw new Error("Dealer not found for source " + batch.source_name);

    const productBySku = new Map(lookups.products.map((product) => [product.sku.toLowerCase(), product]));
    const periodMonth = csvRows[0].period_month || batch.period_start?.slice(0, 7) || new Date().toISOString().slice(0, 7);
    const items: InventoryExternalItemInput[] = csvRows.map((row) => {
      const productSku = row.product_sku?.toLowerCase();
      const product = productSku ? productBySku.get(productSku) : null;
      return {
        product_id: product?.id ?? null,
        product_sku: row.product_sku || null,
        stock_on_hand: numberFromRow(row, "stock_on_hand"),
        inbound_qty: numberFromRow(row, "inbound_qty"),
        outbound_qty: numberFromRow(row, "outbound_qty"),
        adjustment_qty: numberFromRow(row, "adjustment_qty"),
      };
    });

    const input: CreateInventoryExternalInput = {
      dealer_id: dealerId,
      period_month: periodMonth,
      source_channel: "CSV",
      notes: "Imported from report batch " + batch.file_name,
      items,
    };

    const { computedItems, totals } = computeExternalInventoryItems(input.items);
    await inventoryRepository.create(companyId, input, computedItems, totals);
    await reportRepository.updateUploadBatchStatus(companyId, batchId, {
      status: "IMPORTED",
      row_count: csvRows.length,
      imported_count: csvRows.length,
      error_count: 0,
      notes: "Imported " + csvRows.length + " Inventory row(s).",
    });
  } catch (error) {
    await reportRepository.updateUploadBatchStatus(companyId, batchId, {
      status: "FAILED",
      row_count: 0,
      imported_count: 0,
      error_count: 1,
      notes: error instanceof Error ? error.message : "Unknown Inventory import error",
    });
    throw error;
  }
}
