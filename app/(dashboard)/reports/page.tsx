import { BarChart3, FileSpreadsheet, PackageSearch, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { ReportUploadForm } from "@/components/reports/report-upload-form";
import { formatDocumentMoney } from "@/lib/services/documents/document-engine";
import { getReportCenterDashboard } from "@/lib/services/reports/report-center-service";
import { registerReportUpload } from "./actions";

export default async function Page() {
  const { categories, summary, uploads } = await getReportCenterDashboard();

  return (
    <div>
      <PageHeader
        eyebrow="REPORT CENTER"
        title="Report Center"
        description="Central reporting hub for Sale In, Sale Out, Inventory, MOI, and Runrate uploads."
      />

      <section className="mt-6 grid gap-4 md:grid-cols-4">
        <div className="card p-5"><p className="text-sm text-gray-500">Uploads</p><p className="mt-2 text-3xl font-black">{summary.uploadCount}</p></div>
        <div className="card p-5"><p className="text-sm text-gray-500">Sale Out Total</p><p className="mt-2 text-3xl font-black">฿{formatDocumentMoney(summary.saleOutAmount)}</p></div>
        <div className="card p-5"><p className="text-sm text-gray-500">Sale Out MoM</p><p className="mt-2 text-3xl font-black text-orange-700">{summary.saleOutGrowthPercent.toFixed(2)}%</p></div>
        <div className="card p-5"><p className="text-sm text-gray-500">Imported / Failed</p><p className="mt-2 text-3xl font-black">{summary.importedCount} / {summary.failedCount}</p></div>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-5">
        {categories.map((category) => (
          <div key={category.type} className="card p-5">
            <FileSpreadsheet className="text-orange-600" />
            <h2 className="mt-4 font-black">{category.title}</h2>
            <p className="mt-2 text-sm text-gray-500">{category.description}</p>
          </div>
        ))}
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1fr_420px]">
        <div className="space-y-6">
          <section className="grid gap-4 md:grid-cols-3">
            <div className="card p-5">
              <PackageSearch className="text-orange-600" />
              <p className="mt-3 text-sm text-gray-500">Inventory uploads</p>
              <p className="text-2xl font-black">{summary.inventoryUploadCount}</p>
            </div>
            <div className="card p-5">
              <TrendingUp className="text-orange-600" />
              <p className="mt-3 text-sm text-gray-500">Runrate uploads</p>
              <p className="text-2xl font-black">{summary.runrateUploadCount}</p>
            </div>
            <div className="card p-5">
              <BarChart3 className="text-orange-600" />
              <p className="mt-3 text-sm text-gray-500">Registered queue</p>
              <p className="text-2xl font-black">{summary.registeredCount}</p>
            </div>
          </section>

          <section className="card table-wrap">
            <div className="border-b p-4"><h2 className="font-black">Upload Registry</h2></div>
            <table className="data-table">
              <thead><tr><th>Type</th><th>Source</th><th>Period</th><th>File</th><th>Status</th><th>Rows</th></tr></thead>
              <tbody>
                {uploads.map((upload) => (
                  <tr key={upload.id}>
                    <td className="font-bold">{upload.report_type}</td>
                    <td>{upload.source_name}</td>
                    <td>{upload.period_start ?? "-"} - {upload.period_end ?? "-"}</td>
                    <td>
                      <b>{upload.file_name}</b>
                      <p className="text-xs text-gray-500">{upload.storage_path ?? "No storage path yet"}</p>
                    </td>
                    <td>{upload.status}</td>
                    <td>{upload.imported_count}/{upload.row_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!uploads.length && <p className="p-6 text-gray-500">No report uploads registered yet.</p>}
          </section>
        </div>

        <ReportUploadForm action={registerReportUpload} />
      </section>
    </div>
  );
}
