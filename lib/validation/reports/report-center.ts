export type CreateReportUploadInput = {
  report_type: "SALE_IN" | "SALE_OUT" | "INVENTORY" | "MOI" | "RUNRATE" | "OTHER";
  source_name: string;
  period_start: string | null;
  period_end: string | null;
  file_name: string;
  file_size_bytes: number | null;
  storage_bucket: string | null;
  storage_path: string | null;
  notes: string | null;
};

const reportTypes = ["SALE_IN", "SALE_OUT", "INVENTORY", "MOI", "RUNRATE", "OTHER"] as const;
const text = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();

const numberOrNull = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

export function parseReportUploadForm(fd: FormData): CreateReportUploadInput {
  const reportType = text(fd, "report_type").toUpperCase();
  if (!reportTypes.includes(reportType as CreateReportUploadInput["report_type"])) throw new Error("Invalid report type");

  const input = {
    report_type: reportType as CreateReportUploadInput["report_type"],
    source_name: text(fd, "source_name"),
    period_start: text(fd, "period_start") || null,
    period_end: text(fd, "period_end") || null,
    file_name: text(fd, "file_name"),
    file_size_bytes: numberOrNull(fd.get("file_size_bytes")),
    storage_bucket: text(fd, "storage_bucket") || null,
    storage_path: text(fd, "storage_path") || null,
    notes: text(fd, "notes") || null,
  };

  if (!input.source_name) throw new Error("Source name is required");
  if (!input.file_name) throw new Error("File name is required");
  if (input.period_start && input.period_end && input.period_start > input.period_end) throw new Error("Period start must be before period end");

  return input;
}
