import Link from "next/link";
import { notFound } from "next/navigation";
import { BarChart3, FileSpreadsheet, Search } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { formatDocumentMoney } from "@/lib/services/documents/document-engine";
import { getExternalInventoryPreview } from "@/lib/services/reports/external-inventory-service";
import { getMonthOfInventoryPreview } from "@/lib/services/reports/month-of-inventory-service";
import { getReportCenterCategory } from "@/lib/services/reports/report-center-service";
import { getSaleInReportPreview } from "@/lib/services/sales/sale-in-service";
import { getSaleOutReportPreview } from "@/lib/services/sales/sale-out-service";
import { importInventoryUploadAction, importMonthOfInventoryUploadAction, importSaleInUploadAction, importSaleOutUploadAction } from "../actions";

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
  const saleInPreview = category.type === "SALE_IN"
    ? await getSaleInReportPreview({
        from: searchValue(query, "from"),
        to: searchValue(query, "to"),
        dealerId: searchValue(query, "dealer_id"),
        q: searchValue(query, "q"),
      })
    : null;
  const inventoryPreview = category.type === "INVENTORY"
    ? await getExternalInventoryPreview({
        periodMonth: searchValue(query, "period_month"),
        dealerId: searchValue(query, "dealer_id"),
        q: searchValue(query, "q"),
      })
    : null;
  const moiPreview = category.type === "MOI"
    ? await getMonthOfInventoryPreview({
        periodMonth: searchValue(query, "period_month"),
        dealerId: searchValue(query, "dealer_id"),
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
            <div className="mt-5 flex flex-wrap gap-2">
              <Link className="btn-primary inline-block" href="/reports/sale-out/new">Add Sale Out Record</Link>
              <Link className="btn-secondary inline-block" href="/reports/commission">Commission</Link>
              <Link className="btn-secondary inline-block" href="/reports/dealer-targets">Targets</Link>
            </div>
          )}
        </div>
      </section>




      {moiPreview && (
        <section className="mt-6 space-y-6">
          <section className="card p-5">
            <div className="flex items-center gap-3"><Search className="text-orange-600" /><h2 className="font-black">Preview Month of Inventory</h2></div>
            <form className="mt-5 grid gap-4 md:grid-cols-4">
              <label><span className="label">Period Month</span><input className="input" type="month" name="period_month" defaultValue={moiPreview.filters.periodMonth} /></label>
              <label><span className="label">Dealer</span><select className="input" name="dealer_id" defaultValue={moiPreview.filters.dealerId}><option value="">All dealers</option>{moiPreview.options.dealers.map((dealer) => <option key={dealer.id} value={dealer.id}>{dealer.code} - {dealer.name}</option>)}</select></label>
              <label><span className="label">Keyword</span><input className="input" name="q" defaultValue={moiPreview.filters.q} placeholder="Dealer, status" /></label>
              <div className="flex items-end gap-2"><button className="btn-primary">Search</button><Link className="btn-secondary" href="/reports/MOI">Clear</Link></div>
            </form>
          </section>

          <section className="grid gap-4 md:grid-cols-4">
            <div className="card p-5"><p className="text-sm text-gray-500">Matched reports</p><p className="mt-2 text-3xl font-black">{moiPreview.summary.totalReports}</p></div>
            <div className="card p-5"><p className="text-sm text-gray-500">Avg MOI</p><p className="mt-2 text-3xl font-black text-orange-700">{moiPreview.summary.averageMonthOfInventory.toFixed(2)}</p></div>
            <div className="card p-5"><p className="text-sm text-gray-500">Stock On Hand</p><p className="mt-2 text-3xl font-black">{moiPreview.summary.stockOnHand.toLocaleString()}</p></div>
            <div className="card p-5"><p className="text-sm text-gray-500">Reorder Alerts</p><p className="mt-2 text-3xl font-black text-red-700">{moiPreview.summary.reorderCount}</p></div>
          </section>

          <section className="grid gap-6 xl:grid-cols-[1fr_360px]">
            <div className="card table-wrap">
              <div className="border-b p-4"><h2 className="font-black">MOI Preview</h2></div>
              <table className="data-table"><thead><tr><th>Dealer</th><th>Month</th><th>Avg MOI</th><th>Stock</th><th>Avg Sale Out</th><th>Reorder</th></tr></thead><tbody>{moiPreview.reports.map((report) => <tr key={report.id}><td><b>{report.customers?.[0]?.name ?? "-"}</b><p className="text-xs text-gray-500">{report.customers?.[0]?.code ?? "-"}</p></td><td>{report.period_month}</td><td className="font-bold">{Number(report.average_month_of_inventory).toFixed(2)}</td><td>{Number(report.total_stock_on_hand).toLocaleString()}</td><td>{Number(report.total_average_monthly_sale_out).toLocaleString()}</td><td className={report.reorder_count > 0 ? "font-bold text-red-700" : "font-bold text-green-700"}>{report.reorder_count}</td></tr>)}</tbody></table>
              {!moiPreview.reports.length && <p className="p-6 text-gray-500">No MOI data matched these filters.</p>}
            </div>
            <aside className="card p-5"><div className="flex items-center gap-3"><BarChart3 className="text-orange-600" /><h2 className="font-black">Low Coverage</h2></div><div className="mt-4 space-y-3">{moiPreview.summary.lowCoverageDealers.map((dealer) => <div key={dealer.dealerName} className="flex justify-between gap-3 border-b pb-2 text-sm"><span className="font-bold">{dealer.dealerName}</span><span>{dealer.monthOfInventory.toFixed(2)} MOI / {dealer.reorderCount} alerts</span></div>)}{!moiPreview.summary.lowCoverageDealers.length && <p className="text-sm text-gray-500">No low coverage dealers in this period.</p>}</div></aside>
          </section>
        </section>
      )}

      {inventoryPreview && (
        <section className="mt-6 space-y-6">
          <section className="card p-5">
            <div className="flex items-center gap-3">
              <Search className="text-orange-600" />
              <h2 className="font-black">Preview Inventory Data</h2>
            </div>
            <form className="mt-5 grid gap-4 md:grid-cols-4">
              <label>
                <span className="label">Period Month</span>
                <input className="input" type="month" name="period_month" defaultValue={inventoryPreview.filters.periodMonth} />
              </label>
              <label>
                <span className="label">Dealer</span>
                <select className="input" name="dealer_id" defaultValue={inventoryPreview.filters.dealerId}>
                  <option value="">All dealers</option>
                  {inventoryPreview.options.dealers.map((dealer) => (
                    <option key={dealer.id} value={dealer.id}>{dealer.code} - {dealer.name}</option>
                  ))}
                </select>
              </label>
              <label>
                <span className="label">Keyword</span>
                <input className="input" name="q" defaultValue={inventoryPreview.filters.q} placeholder="Dealer, status" />
              </label>
              <div className="flex items-end gap-2">
                <button className="btn-primary">Search</button>
                <Link className="btn-secondary" href="/reports/INVENTORY">Clear</Link>
              </div>
            </form>
          </section>

          <section className="grid gap-4 md:grid-cols-4">
            <div className="card p-5"><p className="text-sm text-gray-500">Matched reports</p><p className="mt-2 text-3xl font-black">{inventoryPreview.summary.totalReports}</p></div>
            <div className="card p-5"><p className="text-sm text-gray-500">Stock On Hand</p><p className="mt-2 text-3xl font-black text-orange-700">{inventoryPreview.summary.stockOnHand.toLocaleString()}</p></div>
            <div className="card p-5"><p className="text-sm text-gray-500">Inbound Qty</p><p className="mt-2 text-3xl font-black">{inventoryPreview.summary.inboundQty.toLocaleString()}</p></div>
            <div className="card p-5"><p className="text-sm text-gray-500">Outbound Qty</p><p className="mt-2 text-3xl font-black">{inventoryPreview.summary.outboundQty.toLocaleString()}</p></div>
          </section>

          <section className="grid gap-6 xl:grid-cols-[1fr_360px]">
            <div className="card table-wrap">
              <div className="border-b p-4"><h2 className="font-black">Inventory Preview</h2></div>
              <table className="data-table">
                <thead><tr><th>Dealer</th><th>Month</th><th>Status</th><th>On Hand</th><th>Inbound</th><th>Outbound</th><th>Adjustment</th></tr></thead>
                <tbody>
                  {inventoryPreview.reports.map((report) => (
                    <tr key={report.id}>
                      <td><b>{report.customers?.[0]?.name ?? "-"}</b><p className="text-xs text-gray-500">{report.customers?.[0]?.code ?? "-"}</p></td>
                      <td>{report.period_month}</td>
                      <td>{report.status}</td>
                      <td className="font-bold">{Number(report.total_stock_on_hand).toLocaleString()}</td>
                      <td>{Number(report.total_inbound_qty).toLocaleString()}</td>
                      <td>{Number(report.total_outbound_qty).toLocaleString()}</td>
                      <td>{Number(report.total_adjustment_qty).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!inventoryPreview.reports.length && <p className="p-6 text-gray-500">No Inventory data matched these filters.</p>}
            </div>
            <aside className="card p-5">
              <div className="flex items-center gap-3"><BarChart3 className="text-orange-600" /><h2 className="font-black">Top Stock Dealers</h2></div>
              <div className="mt-4 space-y-3">
                {inventoryPreview.summary.topDealers.map((dealer) => (
                  <div key={dealer.dealerName} className="flex justify-between gap-3 border-b pb-2 text-sm">
                    <span className="font-bold">{dealer.dealerName}</span>
                    <span>{dealer.stockOnHand.toLocaleString()}</span>
                  </div>
                ))}
                {!inventoryPreview.summary.topDealers.length && <p className="text-sm text-gray-500">No dealer stock in this period.</p>}
              </div>
            </aside>
          </section>
        </section>
      )}

      {saleInPreview && (
        <section className="mt-6 space-y-6">
          <section className="card p-5">
            <div className="flex items-center gap-3">
              <Search className="text-orange-600" />
              <h2 className="font-black">Preview Sale In Data</h2>
            </div>
            <form className="mt-5 grid gap-4 md:grid-cols-4">
              <label>
                <span className="label">From</span>
                <input className="input" type="date" name="from" defaultValue={saleInPreview.filters.from} />
              </label>
              <label>
                <span className="label">To</span>
                <input className="input" type="date" name="to" defaultValue={saleInPreview.filters.to} />
              </label>
              <label>
                <span className="label">Dealer</span>
                <select className="input" name="dealer_id" defaultValue={saleInPreview.filters.dealerId}>
                  <option value="">All dealers</option>
                  {saleInPreview.options.dealers.map((dealer) => (
                    <option key={dealer.id} value={dealer.id}>{dealer.code} - {dealer.name}</option>
                  ))}
                </select>
              </label>
              <label>
                <span className="label">Keyword</span>
                <input className="input" name="q" defaultValue={saleInPreview.filters.q} placeholder="Document, dealer" />
              </label>
              <div className="flex items-end gap-2 md:col-span-4">
                <button className="btn-primary">Search</button>
                <Link className="btn-secondary" href="/reports/SALE_IN">Clear</Link>
              </div>
            </form>
          </section>

          <section className="grid gap-4 md:grid-cols-4">
            <div className="card p-5"><p className="text-sm text-gray-500">Matched reports</p><p className="mt-2 text-3xl font-black">{saleInPreview.summary.totalReports}</p></div>
            <div className="card p-5"><p className="text-sm text-gray-500">Net Sale In</p><p className="mt-2 text-3xl font-black">THB {formatDocumentMoney(saleInPreview.summary.netAmount)}</p></div>
            <div className="card p-5"><p className="text-sm text-gray-500">This Month</p><p className="mt-2 text-3xl font-black text-orange-700">THB {formatDocumentMoney(saleInPreview.summary.currentMonthAmount)}</p></div>
            <div className="card p-5"><p className="text-sm text-gray-500">MoM Growth</p><p className="mt-2 text-3xl font-black">{saleInPreview.summary.growthPercent.toFixed(2)}%</p></div>
          </section>

          <section className="grid gap-6 xl:grid-cols-[1fr_360px]">
            <div className="card table-wrap">
              <div className="border-b p-4"><h2 className="font-black">Sale In Preview</h2></div>
              <table className="data-table">
                <thead><tr><th>No.</th><th>Dealer</th><th>Report Date</th><th>Period</th><th>Status</th><th>Net</th></tr></thead>
                <tbody>
                  {saleInPreview.reports.map((report) => (
                    <tr key={report.id}>
                      <td className="font-bold">{report.document_no}</td>
                      <td>{report.customers?.[0]?.name ?? "-"}</td>
                      <td>{report.report_date}</td>
                      <td>{report.period_start} - {report.period_end}</td>
                      <td>{report.status}</td>
                      <td className="font-bold">THB {formatDocumentMoney(report.net_amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!saleInPreview.reports.length && <p className="p-6 text-gray-500">No Sale In data matched these filters.</p>}
            </div>

            <aside className="card p-5">
              <div className="flex items-center gap-3">
                <BarChart3 className="text-orange-600" />
                <h2 className="font-black">Top Dealers</h2>
              </div>
              <div className="mt-4 space-y-3">
                {saleInPreview.summary.topDealers.map((dealer) => (
                  <div key={dealer.dealerName} className="flex justify-between gap-3 border-b pb-2 text-sm">
                    <span className="font-bold">{dealer.dealerName}</span>
                    <span>THB {formatDocumentMoney(dealer.amount)}</span>
                  </div>
                ))}
                {!saleInPreview.summary.topDealers.length && <p className="text-sm text-gray-500">No dealer Sale In in this range.</p>}
              </div>
            </aside>
          </section>
        </section>
      )}

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
                  {category.type === "SALE_IN" && ["UPLOADED", "FAILED"].includes(upload.status) && (
                    <form action={importSaleInUploadAction}>
                      <input type="hidden" name="batch_id" value={upload.id} />
                      <button className="btn-secondary btn-small">Import</button>
                    </form>
                  )}
                  {category.type === "INVENTORY" && ["UPLOADED", "FAILED"].includes(upload.status) && (
                    <form action={importInventoryUploadAction}>
                      <input type="hidden" name="batch_id" value={upload.id} />
                      <button className="btn-secondary btn-small">Import</button>
                    </form>
                  )}
                  {category.type === "MOI" && ["UPLOADED", "FAILED"].includes(upload.status) && (
                    <form action={importMonthOfInventoryUploadAction}>
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
