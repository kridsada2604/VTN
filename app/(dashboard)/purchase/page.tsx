import Link from "next/link";
import { ClipboardList, PackageCheck, Receipt, Truck } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { formatDocumentMoney } from "@/lib/services/documents/document-engine";
import { getPurchaseDashboard } from "@/lib/services/purchase/purchase-order-service";

const modules = [
  ["/suppliers", "Supplier", "Supplier and service provider master data", Truck, true],
  ["/purchase/orders", "Purchase Order", "Create and track purchase orders", ClipboardList, true],
  ["/purchase/orders", "Receive", "Receive stock into warehouse and create stock movement", PackageCheck, true],
  ["/purchase/orders", "Payment", "Record supplier payment and accounting posting", Receipt, true],
] as const;

export default async function Page() {
  const { orders, summary } = await getPurchaseDashboard();

  return (
    <div>
      <PageHeader eyebrow="PURCHASE" title="Purchase" description="Supplier, PO, receiving, and supplier payment management." />

      <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <div className="card p-5"><p className="text-sm text-gray-500">Purchase Orders</p><p className="mt-2 text-3xl font-black">{summary.totalOrders}</p></div>
        <div className="card p-5"><p className="text-sm text-gray-500">Total PO</p><p className="mt-2 text-3xl font-black">฿{formatDocumentMoney(summary.totalAmount)}</p></div>
        <div className="card p-5"><p className="text-sm text-gray-500">Outstanding</p><p className="mt-2 text-3xl font-black text-orange-700">฿{formatDocumentMoney(summary.outstandingAmount)}</p></div>
        <div className="card p-5"><p className="text-sm text-gray-500">Pending Receipt</p><p className="mt-2 text-3xl font-black">{summary.pendingReceiptCount}</p></div>
        <div className="card p-5"><p className="text-sm text-gray-500">Overdue Expected</p><p className="mt-2 text-3xl font-black text-red-700">{summary.overdueExpectedCount}</p></div>
      </section>

      <section className="module-grid mt-7">
        {modules.map(([href, title, desc, Icon, ready]) => (
          <Link href={href} key={title} className="card module-link p-5">
            <Icon className="text-orange-600" />
            <h2 className="mt-4 font-black">{title}</h2>
            <p className="mt-2 text-sm text-gray-500">{desc}</p>
            <span className={`mt-4 inline-block rounded-full px-3 py-1 text-xs font-bold ${ready ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}`}>
              {ready ? "Ready" : "In progress"}
            </span>
          </Link>
        ))}
      </section>

      <section className="card table-wrap mt-7">
        <div className="border-b p-4"><h2 className="font-black">Recent Purchase Orders</h2></div>
        <table className="data-table">
          <thead><tr><th>No.</th><th>Supplier</th><th>Order Date</th><th>Expected</th><th>Status</th><th>Total</th><th>Balance</th><th /></tr></thead>
          <tbody>
            {orders.slice(0, 8).map((order) => (
              <tr key={order.id}>
                <td className="font-bold">{order.document_no}</td>
                <td>{order.suppliers?.[0]?.name ?? "-"}</td>
                <td>{order.order_date}</td>
                <td>{order.expected_date ?? "-"}</td>
                <td>{order.status}</td>
                <td>฿{formatDocumentMoney(order.total_amount)}</td>
                <td className="font-bold">฿{formatDocumentMoney(order.balance_amount)}</td>
                <td><Link className="btn-secondary btn-small" href={`/purchase/orders/${order.id}`}>Open</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
        {!orders.length && <p className="p-6 text-gray-500">No purchase orders yet.</p>}
      </section>
    </div>
  );
}
