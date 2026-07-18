import Link from "next/link";
import { notFound } from "next/navigation";
import { BarChart3, FileSpreadsheet, Search } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { formatDocumentMoney } from "@/lib/services/documents/document-engine";
import { getReportCenterCategory } from "@/lib/services/reports/report-center-service";
import { getSaleOutReportPreview } from "@/lib/services/sales/sale-out-service";
import { importSaleOutUploadAction } from "../actions";

const statusClass: Record<string, string> = {
  READY: "bg-green-100 text-green-800",
  FOUNDATION: "bg-amber-100 text-amber-800",
  IN_PROGRESS: "bg-slate-100 text-slate-700",
};

const statusLabel: Record<string, string> = {
  READY: "Ready",
  FOUNDATION: "Foundation",
  IN_PROGRESS: "In progress",
};

type SearchParams = Record<string, string | string[] | undefined>;

function searchValue(searchParams: SearchParams, key: string) {
  const value = searchParams[key];
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

export default async function Page({ params, searchParams }: { params: Promise<{ type: string }>; searchParams: Promise<SearchParams> }) {
  const { type } = await params;
  const query = await searchParams;
  const result = await getReportCenterCategory(type);
  if (!result) notFound();

  const { category, uploads } = result;
  const saleOutPreview = category.type === "SALE_OUT"
    ? await getSaleOutReportPreview({
        from: searchValue(query, "from"),
        to: searchValue(query, "to"),
        dealerId: searchValue(query, "dealer_id"),
        status: searchValue(query, "status"),
        q: searchValue(query, "q"),
      })
    : null;

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
            <Link className="btn-primary mt-5 inline-block" href="/reports/sale-out/new">
              Add Sale Out Record
            </Link>
          )}
        </div>
      </section>

      {saleOutPreview && (
        <section className="mt-6 space-y-6">
          <section className="card p-5">
            <div className="flex items-center gap-3">
              <Search className="text-orange-600" />
              <h2 className="font-black">Preview Sale Out Data</h2>
            </div>
            <form className="mt-5 grid gap-4 md:grid-cols-5">
              <label>
                <span className="label">From</span>
                <input className="input" type="date" name="from" defaultValue={saleOutPreview.filters.from} />
              </label>
              <label>
                <span className="label">To</span>
                <input className="input" type="date" name="to" defaultValue={saleOutPreview.filters.to} />
              </label>
              <label>
                <span className="label">Dealer</span>
                <select className="input" name="dealer_id" defaultValue={saleOutPreview.filters.dealerId}>
                  <option value="">All dealers</option>
                  {saleOutPreview.options.dealers.map((dealer) => (
                    <option key={dealer.id} value={dealer.id}>{dealer.code} - {dealer.name}</option>
                  ))}
                </select>
              </label>
              <label>
                <span className="label">Status</span>
                <select className="input" name="status" defaultValue={saleOutPreview.filters.status}>
                  <option value="">All statuses</option>
                  {saleOutPreview.options.statuses.map((status) => <option key={status} value={status}>{status}</option>)}
                </select>
              </label>
              <label>
                <span className="label">Keyword</span>
                <input className="input" name="q" defaultValue={saleOutPreview.filters.q} placeholder="Document, dealer, salesperson" />
              </label>
              <div className="flex items-end gap-2 md:col-span-5">
                <button className="btn-primary">Search</button>
                <Link className="btn-secondary" href="/reports/SALE_OUT">Clear</Link>
              </div>
            </form>
          </section>

          <section className="grid gap-4 md:grid-cols-4">
            <div className="card p-5"><p className="text-sm text-gray-500">Matched reports</p><p className="mt-2 text-3xl font-black">{saleOutPreview.summary.totalReports}</p></div>
            <div className="card p-5"><p className="text-sm text-gray-500">Net Sale Out</p><p className="mt-2 text-3xl font-black">THB {formatDocumentMoney(saleOutPreview.summary.netAmount)}</p></div>
            <div className="card p-5"><p className="text-sm text-gray-500">This Month</p><p className="mt-2 text-3xl font-black text-orange-700">THB {formatDocumentMoney(saleOutPreview.summary.currentMonthAmount)}</p></div>
            <div className="card p-5"><p className="text-sm text-gray-500">MoM Growth</p><p className="mt-2 text-3xl font-black">{saleOutPreview.summary.growthPercent.toFixed(2)}%</p></div>
          </section>

          <section className="grid gap-6 xl:grid-cols-[1fr_360px]">
            <div className="card table-wrap">
              <div className="border-b p-4"><h2 className="font-black">Sale Out Preview</h2></div>
              <table className="data-table">
                <thead><tr><th>No.</th><th>Dealer</th><th>Salesperson</th><th>Report Date</th><th>Period</th><th>Status</th><th>Net</th><th /></tr></thead>
                <tbody>
                  {saleOutPreview.reports.map((report) => (
                    <tr key={report.id}>
                      <td className="font-bold">{report.document_no}</td>
                      <td>{report.customers?.[0]?.name ?? "-"}</td>
                      <td>{report.profiles?.[0]?.full_name ?? report.profiles?.[0]?.email ?? "-"}</td>
                      <td>{report.report_date}</td>
                      <td>{report.period_start} - {report.period_end}</td>
                      <td>{report.status}</td>
                      <td className="font-bold">THB {formatDocumentMoney(report.net_amount)}</td>
                      <td><Link className="btn-secondary btn-small" href={`/reports/sale-out/${report.id}`}>Open</Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!saleOutPreview.reports.length && <p className="p-6 text-gray-500">No Sale Out data matched these filters.</p>}
            </div>

            <aside className="space-y-6">
              <section className="card p-5">
                <div className="flex items-center gap-3">
                  <BarChart3 className="text-orange-600" />
                  <h2 className="font-black">Top Dealers</h2>
                </div>
                <div className="mt-4 space-y-3">
                  {saleOutPreview.summary.topDealers.map((dealer) => (
                    <div key={dealer.dealerName} className="flex justify-between gap-3 border-b pb-2 text-sm">
                      <span className="font-bold">{dealer.dealerName}</span>
                      <span>THB {formatDocumentMoney(dealer.amount)}</span>
                    </div>
                  ))}
                  {!saleOutPreview.summary.topDealers.length && <p className="text-sm text-gray-500">No dealer performance in this range.</p>}
                </div>
              </section>
              <section className="card p-5">
                <h2 className="font-black">Top Salespeople</h2>
                <div className="mt-4 space-y-3">
                  {saleOutPreview.summary.topSalespeople.map((person) => (
                    <div key={person.salespersonName} className="flex justify-between gap-3 border-b pb-2 text-sm">
                      <span className="font-bold">{person.salespersonName}</span>
                      <span>THB {formatDocumentMoney(person.amount)}</span>
                    </div>
                  ))}
                  {!saleOutPreview.summary.topSalespeople.length && <p className="text-sm text-gray-500">No salesperson performance in this range.</p>}
                </div>
              </section>
            </aside>
          </section>
        </section>
      )}

      <section className="card table-wrap mt-6">
        <div className="border-b p-4"><h2 className="font-black">Upload Registry</h2></div>
        <table className="data-table">
          <thead><tr><th>Source</th><th>Period</th><th>File</th><th>Status</th><th>Rows</th><th>Created</th><th /></tr></thead>
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
                <td>
                  {category.type === "SALE_OUT" && ["UPLOADED", "FAILED"].includes(upload.status) && (
                    <form action={importSaleOutUploadAction}>
                      <input type="hidden" name="batch_id" value={upload.id} />
                      <button className="btn-secondary btn-small">Import</button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!uploads.length && <p className="p-6 text-gray-500">No files registered for this report type yet.</p>}
      </section>
    </div>
  );
}