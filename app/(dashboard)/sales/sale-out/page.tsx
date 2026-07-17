import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { formatDocumentMoney } from "@/lib/services/documents/document-engine";
import { getSaleOutDashboard } from "@/lib/services/sales/sale-out-service";

export default async function Page() {
  const { reports, summary } = await getSaleOutDashboard();

  return (
    <div>
      <PageHeader
        eyebrow="SALES"
        title="Sale Out"
        description="Dealer sell-out reports for commission, real demand analysis, and growth tracking."
        action={<Link className="btn-primary" href="/sales/sale-out/new">+ Sale Out</Link>}
      />

      <section className="mt-6 grid gap-4 md:grid-cols-4">
        <div className="card p-5"><p className="text-sm text-gray-500">Reports</p><p className="mt-2 text-3xl font-black">{summary.totalReports}</p></div>
        <div className="card p-5"><p className="text-sm text-gray-500">Total Sale Out</p><p className="mt-2 text-3xl font-black">฿{formatDocumentMoney(summary.netAmount)}</p></div>
        <div className="card p-5"><p className="text-sm text-gray-500">This Month</p><p className="mt-2 text-3xl font-black text-orange-700">฿{formatDocumentMoney(summary.currentMonthAmount)}</p></div>
        <div className="card p-5"><p className="text-sm text-gray-500">MoM Growth</p><p className="mt-2 text-3xl font-black">{summary.growthPercent.toFixed(2)}%</p></div>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="card table-wrap">
          <div className="border-b p-4"><h2 className="font-black">Sale Out Reports</h2></div>
          <table className="data-table">
            <thead><tr><th>No.</th><th>Dealer</th><th>Salesperson</th><th>Period</th><th>Status</th><th>Net</th><th /></tr></thead>
            <tbody>
              {reports.map((report) => (
                <tr key={report.id}>
                  <td className="font-bold">{report.document_no}</td>
                  <td>{report.customers?.[0]?.name ?? "-"}</td>
                  <td>{report.profiles?.[0]?.full_name ?? report.profiles?.[0]?.email ?? "-"}</td>
                  <td>{report.period_start} - {report.period_end}</td>
                  <td>{report.status}</td>
                  <td className="font-bold">฿{formatDocumentMoney(report.net_amount)}</td>
                  <td><Link className="btn-secondary btn-small" href={`/sales/sale-out/${report.id}`}>Open</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
          {!reports.length && <p className="p-6 text-gray-500">No Sale Out reports yet.</p>}
        </div>

        <aside className="space-y-6">
          <section className="card p-5">
            <h2 className="font-black">Top Dealers</h2>
            <div className="mt-4 space-y-3">
              {summary.topDealers.map((dealer) => (
                <div key={dealer.dealerName} className="flex justify-between gap-3 border-b pb-2 text-sm">
                  <span className="font-bold">{dealer.dealerName}</span>
                  <span>฿{formatDocumentMoney(dealer.amount)}</span>
                </div>
              ))}
              {!summary.topDealers.length && <p className="text-sm text-gray-500">No dealer performance yet.</p>}
            </div>
          </section>
          <section className="card p-5">
            <h2 className="font-black">Top Salespeople</h2>
            <div className="mt-4 space-y-3">
              {summary.topSalespeople.map((person) => (
                <div key={person.salespersonName} className="flex justify-between gap-3 border-b pb-2 text-sm">
                  <span className="font-bold">{person.salespersonName}</span>
                  <span>฿{formatDocumentMoney(person.amount)}</span>
                </div>
              ))}
              {!summary.topSalespeople.length && <p className="text-sm text-gray-500">No salesperson performance yet.</p>}
            </div>
          </section>
        </aside>
      </section>
    </div>
  );
}
