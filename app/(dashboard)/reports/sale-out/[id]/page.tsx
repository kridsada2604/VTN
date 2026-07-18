import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { formatDocumentMoney } from "@/lib/services/documents/document-engine";
import { getSaleOutDetail } from "@/lib/services/sales/sale-out-service";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { report, items } = await getSaleOutDetail(id);
  if (!report) notFound();

  return (
    <div>
      <PageHeader
        eyebrow="REPORT CENTER"
        title={report.document_no}
        description={`${report.customers?.[0]?.name ?? "Dealer"} / ${report.period_start} - ${report.period_end}`}
      />
      <div className="my-6"><Link className="btn-secondary" href="/reports/SALE_OUT">Back to Sale Out Analysis</Link></div>

      <section className="grid gap-4 md:grid-cols-4">
        <div className="card p-5"><p className="text-sm text-gray-500">Dealer</p><p className="mt-2 font-black">{report.customers?.[0]?.name ?? "-"}</p></div>
        <div className="card p-5"><p className="text-sm text-gray-500">Salesperson</p><p className="mt-2 font-black">{report.profiles?.[0]?.full_name ?? report.profiles?.[0]?.email ?? "-"}</p></div>
        <div className="card p-5"><p className="text-sm text-gray-500">Status</p><p className="mt-2 font-black">{report.status}</p></div>
        <div className="card p-5"><p className="text-sm text-gray-500">Net Amount</p><p className="mt-2 text-2xl font-black text-orange-700">THB {formatDocumentMoney(report.net_amount)}</p></div>
      </section>

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

      {report.notes && (
        <section className="card mt-6 p-5">
          <h2 className="font-black">Notes</h2>
          <p className="mt-2 text-sm text-gray-600">{report.notes}</p>
        </section>
      )}
    </div>
  );
}