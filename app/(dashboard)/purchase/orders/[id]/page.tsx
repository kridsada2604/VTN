import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { PrintButton } from "@/components/sales/print-button";
import { formatDocumentMoney } from "@/lib/services/documents/document-engine";
import { getPurchaseOrderDetail } from "@/lib/services/purchase/purchase-order-service";
import { payPurchaseOrderAction, postPurchaseOrderAccountingAction } from "../actions";

const paymentMethodLabel: Record<string, string> = {
  CASH: "Cash",
  BANK_TRANSFER: "Bank transfer",
  CHEQUE: "Cheque",
  CREDIT_CARD: "Credit card",
  OTHER: "Other",
};

const statusLabel: Record<string, string> = {
  DRAFT: "Draft",
  SENT: "Sent",
  PARTIALLY_RECEIVED: "Partially received",
  RECEIVED: "Received",
  CANCELLED: "Cancelled",
};

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { order, items, payments, events } = await getPurchaseOrderDetail(id);
  if (!order) notFound();

  const supplier = order.suppliers?.[0];
  const balanceAmount = Number(order.balance_amount);
  const canPostAccounting = !order.journal_entry_id && ["RECEIVED", "PARTIALLY_RECEIVED"].includes(order.status);

  return (
    <div className="print:bg-white">
      <PageHeader eyebrow="PURCHASE ORDER" title={order.document_no} description={`${supplier?.name ?? ""} - ${order.order_date}`} />
      <div className="action-row my-6 print:hidden">
        <Link className="btn-secondary" href="/purchase/orders">
          Back
        </Link>
        <Link className="btn-primary" href={`/purchase/orders/${id}/receive`}>
          Receive
        </Link>
        <PrintButton />
        {canPostAccounting && (
          <form action={postPurchaseOrderAccountingAction}>
            <input type="hidden" name="purchase_order_id" value={order.id} />
            <button className="btn-primary">Post PO</button>
          </form>
        )}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <section className="card p-5 print:border-0 print:shadow-none">
          <div className="mb-7 flex items-start justify-between gap-4">
            <div>
              <p className="text-2xl font-black">
                <span className="text-orange-600">VTN</span> Business
              </p>
              <p className="text-sm text-gray-500">Purchase Order</p>
            </div>
            <div className="text-right">
              <p className="text-xl font-black">{order.document_no}</p>
              <p className="text-sm text-gray-500">Status: {statusLabel[order.status] ?? order.status}</p>
              <p className="text-sm text-gray-500">Accounting: {order.journal_entry_id ? "Posted" : "Not posted"}</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-sm text-gray-500">Supplier</p>
              <p className="font-bold">{supplier?.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Tax ID</p>
              <p className="font-bold">{supplier?.tax_id ?? "-"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Order date</p>
              <p className="font-bold">{order.order_date}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Expected date</p>
              <p className="font-bold">{order.expected_date ?? "-"}</p>
            </div>
            <div className="sm:col-span-2">
              <p className="text-sm text-gray-500">Address</p>
              <p className="font-bold">{supplier?.address ?? "-"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Phone</p>
              <p className="font-bold">{supplier?.phone ?? "-"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-bold">{supplier?.email ?? "-"}</p>
            </div>
          </div>

          <div className="table-wrap mt-6">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Qty</th>
                  <th>Cost</th>
                  <th>Discount</th>
                  <th>Tax</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.description}</td>
                    <td>{item.quantity}</td>
                    <td>{formatDocumentMoney(item.unit_cost)}</td>
                    <td>{formatDocumentMoney(item.line_discount)}</td>
                    <td>{formatDocumentMoney(item.line_tax)}</td>
                    <td className="font-bold">{formatDocumentMoney(item.line_total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="ml-auto mt-6 max-w-sm space-y-2 text-right">
            <p>Subtotal: {formatDocumentMoney(order.subtotal)}</p>
            <p>Discount: {formatDocumentMoney(order.discount_amount)}</p>
            <p>Tax: {formatDocumentMoney(order.tax_amount)}</p>
            <p className="text-2xl font-black">Total {formatDocumentMoney(order.total_amount)}</p>
            <p className="font-bold text-green-700">Paid {formatDocumentMoney(order.paid_amount)}</p>
            <p className="font-bold text-orange-700">Balance {formatDocumentMoney(order.balance_amount)}</p>
          </div>

          {order.notes && (
            <div className="mt-6 rounded-xl bg-gray-50 p-4">
              <p className="text-xs font-bold text-gray-500">Notes</p>
              <p className="mt-1">{order.notes}</p>
            </div>
          )}
        </section>

        <aside className="space-y-6 print:hidden">
          <section className="card p-5">
            <h2 className="font-black">Supplier Payment</h2>
            {balanceAmount <= 0 ? (
              <p className="mt-4 text-sm text-green-700">This purchase order is fully paid.</p>
            ) : (
              <form action={payPurchaseOrderAction} className="mt-4 space-y-3">
                <input type="hidden" name="purchase_order_id" value={order.id} />
                <label>
                  <span className="label">Payment date</span>
                  <input className="input" type="date" name="payment_date" required defaultValue={new Date().toISOString().slice(0, 10)} />
                </label>
                <label>
                  <span className="label">Method</span>
                  <select className="input" name="method" required defaultValue="BANK_TRANSFER">
                    {Object.entries(paymentMethodLabel).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span className="label">Amount</span>
                  <input className="input" type="number" min="0.01" max={balanceAmount} step="0.01" name="amount" required defaultValue={balanceAmount} />
                </label>
                <label>
                  <span className="label">Reference</span>
                  <input className="input" name="reference_no" />
                </label>
                <label>
                  <span className="label">Notes</span>
                  <textarea className="input textarea" name="notes" />
                </label>
                <button className="btn-primary w-full">Record supplier payment</button>
              </form>
            )}
          </section>

          <section className="card p-5">
            <h2 className="font-black">Payment History</h2>
            <div className="mt-4 space-y-3">
              {payments.map((payment) => (
                <div key={payment.id} className="rounded-xl border border-gray-200 p-3">
                  <p className="font-bold">{payment.payment_no}</p>
                  <p className="text-sm text-gray-500">
                    {payment.payment_date} - {paymentMethodLabel[payment.method] ?? payment.method}
                  </p>
                  <p className="mt-1 font-black">{formatDocumentMoney(payment.amount)}</p>
                  <p className="mt-1 text-xs text-gray-500">Accounting: {payment.journal_entry_id ? "Posted" : "Not posted"}</p>
                </div>
              ))}
              {!payments.length && <p className="text-sm text-gray-500">No supplier payments yet.</p>}
            </div>
          </section>

          <section className="card p-5">
            <h2 className="font-black">Timeline</h2>
            <div className="mt-5 space-y-5">
              {events.map((event) => (
                <div key={event.id} className="relative border-l-2 border-orange-200 pl-4">
                  <span className="absolute -left-[7px] top-1 h-3 w-3 rounded-full bg-orange-500" />
                  <p className="font-bold">{event.message ?? event.event_type}</p>
                  <p className="mt-1 text-xs text-gray-500">{new Date(event.created_at).toLocaleString("th-TH")}</p>
                </div>
              ))}
              {!events.length && <p className="text-sm text-gray-500">No timeline events yet.</p>}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
