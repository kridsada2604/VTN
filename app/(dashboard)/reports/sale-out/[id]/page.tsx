import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { formatDocumentMoney } from "@/lib/services/documents/document-engine";
import { getSaleOutDetail } from "@/lib/services/sales/sale-out-service";
import { approveSaleOutReport, cancelSaleOutReport } from "../actions";

const statusClass: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  SUBMITTED: "bg-yellow-100 text-yellow-800",
  APPROVED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
};

function formatDateTime(value: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { report, items, events } = await getSaleOutDetail(id);
  if (!report) notFound();

  return (
    <div>
      <PageHeader
        eyebrow="REPORT CENTER"
        title={report.document_no}
        description={`${report.customers?.[0]?.name ?? "Dealer"} / ${report.period_start} - ${report.period_end}`}
      />
      <div className="my-6">
        <Link className="btn-secondary" href="/reports/SALE_OUT">Back to Sale Out Analysis</Link>
      </div>

      <section className="grid gap-4 md:grid-cols-4">
        <div className="card p-5"><p className="text-sm text-gray-500">Dealer</p><p className="mt-2 font-black">{report.customers?.[0]?.name ?? "-"}</p></div>
        <div className="card p-5"><p className="text-sm text-gray-500">Salesperson</p><p className="mt-2 font-black">{report.profiles?.[0]?.full_name ?? report.profiles?.[0]?.email ?? "-"}</p></div>
        <div className="card p-5"><p className="text-sm text-gray-500">Status</p><p className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-black ${statusClass[report.status] ?? "bg-gray-100 text-gray-700"}`}>{report.status}</p></div>
        <div className="card p-5"><p className="text-sm text-gray-500">Net Amount</p><p className="mt-2 text-2xl font-black text-orange-700">THB {formatDocumentMoney(report.net_amount)}</p></div>
      </section>

      {report.status === "SUBMITTED" && (
        <section className="card mt-6 p-5">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
            <div>
              <h2 className="font-black">Approval Workflow</h2>
              <p className="mt-1 text-sm text-gray-600">Review dealer actual sales before commission and growth analysis.</p>
            </div>
            <div className="grid w-full gap-3 md:w-[520px] md:grid-cols-2">
              <form action={approveSaleOutReport} className="space-y-3 rounded-lg border border-green-200 bg-green-50 p-4">
                <input type="hidden" name="report_id" value={report.id} />
                <textarea className="input min-h-20" name="note" placeholder="Approval note" />
                <button className="btn-primary w-full" type="submit">Approve</button>
              </form>
              <form action={cancelSaleOutReport} className="space-y-3 rounded-lg border border-red-200 bg-red-50 p-4">
                <input type="hidden" name="report_id" value={report.id} />
                <textarea className="input min-h-20" name="note" placeholder="Reject / cancel reason" />
                <button className="btn-secondary w-full" type="submit">Reject / Cancel</button>
              </form>
            </div>
          </div>
        </section>
      )}

      {(report.reviewed_at || report.review_note) && (
        <section className="card mt-6 p-5">
          <h2 className="font-black">Review Result</h2>
          <dl className="mt-4 grid gap-4 md:grid-cols-2">
            <div><dt className="text-sm text-gray-500">Reviewed At</dt><dd className="mt-1 font-bold">{formatDateTime(report.reviewed_at)}</dd></div>
            <div><dt className="text-sm text-gray-500">Review Note</dt><dd className="mt-1 font-bold">{report.review_note ?? "-"}</dd></div>
          </dl>
        </section>
      )}

      <section className="card table-wrap mt-6">
        <div className="border-b p-4"><h2 className="font-black">Items</h2></div>
        <table className="data-table">
          <thead><tr><th>Product</th><th>Dealer SKU</th><th>Description</th><th>Qty</th><th>Price</th><th>Discount</th><th>Total</th></tr></thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>{item.products?.[0]?.sku ?? "-"}</td>
                <td>{item.dealer_sku ?? "-"}</td>
                <td>{item.description}</td>
                <td>{item.quantity}</td>
                <td>THB {formatDocumentMoney(item.unit_price)}</td>
                <td>THB {formatDocumentMoney(item.line_discount)}</td>
                <td className="font-bold">THB {formatDocumentMoney(item.line_total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="card mt-6 p-5">
        <h2 className="font-black">Workflow Timeline</h2>
        <div className="mt-4 space-y-3">
          {events.length ? events.map((event) => (
            <div key={event.id} className="rounded-lg border p-4">
              <div className="flex flex-col justify-between gap-2 md:flex-row md:items-center">
                <p className="font-bold">{event.event_type.replaceAll("_", " ")}</p>
                <p className="text-sm text-gray-500">{formatDateTime(event.created_at)}</p>
              </div>
              <p className="mt-1 text-sm text-gray-600">{event.from_status ?? "-"}{" -> "}{event.to_status ?? "-"}</p>
              {event.message && <p className="mt-2 text-sm text-gray-700">{event.message}</p>}
            </div>
          )) : <p className="text-sm text-gray-500">No workflow events yet.</p>}
        </div>
      </section>

      {report.notes && (
        <section className="card mt-6 p-5">
          <h2 className="font-black">Notes</h2>
          <p className="mt-2 text-sm text-gray-600">{report.notes}</p>
        </section>
      )}
    </div>
  );
}
