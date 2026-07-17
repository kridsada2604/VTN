import Link from "next/link";
import { notFound } from "next/navigation";
import { FileSpreadsheet } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { getReportCenterCategory } from "@/lib/services/reports/report-center-service";

const statusClass: Record<string, string> = {
  READY: "bg-green-100 text-green-800",
  FOUNDATION: "bg-amber-100 text-amber-800",
  IN_PROGRESS: "bg-slate-100 text-slate-700",
};

const statusLabel: Record<string, string> = {
  READY: "ใช้งานได้",
  FOUNDATION: "วางโครงแล้ว",
  IN_PROGRESS: "กำลังพัฒนา",
};

export default async function Page({ params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;
  const result = await getReportCenterCategory(type);
  if (!result) notFound();

  const { category, uploads } = result;

  return (
    <div>
      <PageHeader
        eyebrow="REPORT CENTER"
        title={category.title}
        description={category.description}
        action={<Link className="btn-secondary" href="/reports">Back to Report Center</Link>}
      />

      <section className="mt-6 grid gap-4 lg:grid-cols-[1fr_360px]">
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="text-orange-600" />
            <h2 className="font-black">Module Status</h2>
          </div>
          <span className={`mt-4 inline-block rounded-full px-3 py-1 text-xs font-bold ${statusClass[category.status]}`}>
            {statusLabel[category.status]}
          </span>
          <p className="mt-4 text-sm text-gray-600">{category.nextStep}</p>
        </div>

        <div className="card p-5">
          <p className="text-sm text-gray-500">Registered files</p>
          <p className="mt-2 text-4xl font-black">{uploads.length}</p>
          {category.type === "SALE_OUT" && (
            <Link className="btn-primary mt-5 inline-block" href="/sales/sale-out">
              Open Sale Out
            </Link>
          )}
        </div>
      </section>

      <section className="card table-wrap mt-6">
        <div className="border-b p-4"><h2 className="font-black">Upload Registry</h2></div>
        <table className="data-table">
          <thead><tr><th>Source</th><th>Period</th><th>File</th><th>Status</th><th>Rows</th><th>Created</th></tr></thead>
          <tbody>
            {uploads.map((upload) => (
              <tr key={upload.id}>
                <td>{upload.source_name}</td>
                <td>{upload.period_start ?? "-"} - {upload.period_end ?? "-"}</td>
                <td>
                  <b>{upload.file_name}</b>
                  <p className="text-xs text-gray-500">{upload.storage_path ?? "No storage path yet"}</p>
                </td>
                <td>{upload.status}</td>
                <td>{upload.imported_count}/{upload.row_count}</td>
                <td>{upload.created_at}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!uploads.length && <p className="p-6 text-gray-500">No files registered for this report type yet.</p>}
      </section>
    </div>
  );
}
