import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { getSalesOrderDetail } from "@/lib/services/sales/sales-order-service";
import { createInvoiceFromSalesOrderAction, deliverSalesOrderAction, reserveSalesOrderAction } from "../actions";

const money = (value: number | string) => Number(value).toLocaleString("th-TH", { minimumFractionDigits: 2 });

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { order, items, deliveries, events, warehouses } = await getSalesOrderDetail(id);
  if (!order) notFound();
  const today = new Date().toISOString().slice(0, 10);
  const canDeliver = order.status === "RESERVED" || order.status === "PARTIALLY_DELIVERED";
  const deliverableItems = items
    .map((item) => ({
      ...item,
      remainingQuantity: Math.max(Number(item.quantity) - Number(item.delivered_quantity), 0),
      reservedRemaining: Math.max(Number(item.reserved_quantity) - Number(item.delivered_quantity), 0),
    }))
    .filter((item) => item.product_id && item.remainingQuantity > 0 && item.reservedRemaining > 0);

  return (
    <div>
      <PageHeader
        eyebrow="SALES ORDER"
        title={order.document_no}
        description={`${order.customers?.[0]?.name ?? ""} / ${order.order_date}`}
      />

      <div className="mb-4 mt-6 flex flex-wrap gap-2">
        <Link className="btn-secondary" href="/sales/orders">Back to Orders</Link>
        {order.status === "CONFIRMED" && (
          <form action={reserveSalesOrderAction} className="flex flex-wrap gap-2">
            <input type="hidden" name="sales_order_id" value={order.id} />
            <select className="input" name="warehouse_id" required defaultValue="">
              <option value="">Select warehouse</option>
              {warehouses.map((warehouse) => (
                <option key={warehouse.id} value={warehouse.id}>
                  {warehouse.code} - {warehouse.name}
                </option>
              ))}
            </select>
            <button className="btn-primary">Reserve Stock</button>
          </form>
        )}
        {order.status === "DELIVERED" && (
          <form action={createInvoiceFromSalesOrderAction} className="flex flex-wrap gap-2">
            <input type="hidden" name="sales_order_id" value={order.id} />
            <input className="input" type="date" name="invoice_date" defaultValue={today} required />
            <button className="btn-primary">Create Invoice</button>
          </form>
        )}
      </div>

      <section className="card p-5">
        <div className="grid gap-4 md:grid-cols-4">
          <div><p className="label">Status</p><p className="font-bold">{order.status}</p></div>
          <div><p className="label">Warehouse</p><p className="font-bold">{order.warehouses?.[0]?.name ?? "-"}</p></div>
          <div><p className="label">Requested Delivery</p><p className="font-bold">{order.requested_delivery_date ?? "-"}</p></div>
          <div><p className="label">Total</p><p className="font-bold">THB {money(order.total_amount)}</p></div>
        </div>
      </section>

      <section className="card table-wrap mt-6">
        <table className="data-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Description</th>
              <th>Qty</th>
              <th>Reserved</th>
              <th>Delivered</th>
              <th>Backorder</th>
              <th>Price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>{item.products?.[0]?.sku ?? "-"}</td>
                <td>{item.description}</td>
                <td>{Number(item.quantity).toLocaleString("th-TH")}</td>
                <td>{Number(item.reserved_quantity).toLocaleString("th-TH")}</td>
                <td>{Number(item.delivered_quantity).toLocaleString("th-TH")}</td>
                <td>{Math.max(Number(item.quantity) - Number(item.delivered_quantity), 0).toLocaleString("th-TH")}</td>
                <td>THB {money(item.unit_price)}</td>
                <td className="font-bold">THB {money(item.line_total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="mt-6 grid gap-4 xl:grid-cols-[1fr_360px]">
        <div className="card p-5">
          <p className="font-black">Deliveries</p>
          <div className="mt-3 space-y-2">
            {deliveries.map((delivery) => (
              <div key={delivery.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-50 p-3">
                <div>
                  <b>{delivery.document_no}</b>
                  <p className="text-sm text-gray-500">{delivery.delivery_date} / {delivery.status}</p>
                </div>
                <Link className="btn-secondary btn-small" href={`/sales/orders/${order.id}/deliveries/${delivery.id}/print`}>Print</Link>
              </div>
            ))}
          </div>
          {!deliveries.length && <p className="mt-3 text-gray-500">No deliveries yet.</p>}

          <div className="mt-5 border-t pt-4">
            <p className="font-black">Timeline</p>
            <div className="mt-3 space-y-2">
              {events.map((event) => (
                <div key={event.id} className="rounded-xl bg-slate-50 p-3">
                  <b>{event.event_type}</b>
                  <p className="text-sm text-gray-500">{event.message ?? "-"} / {event.created_at}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside className="space-y-4">
          {canDeliver && (
            <div className="card p-5">
              <h2 className="font-black">Create Delivery</h2>
              <form action={deliverSalesOrderAction} className="mt-4 space-y-3">
                <input type="hidden" name="sales_order_id" value={order.id} />
                <label>
                  <span className="label">Delivery date</span>
                  <input className="input" type="date" name="delivery_date" defaultValue={today} required />
                </label>
                <div className="space-y-2">
                  {deliverableItems.map((item) => (
                    <label key={item.id} className="block rounded-lg border p-3">
                      <span className="text-sm font-bold">{item.products?.[0]?.sku ?? item.description}</span>
                      <span className="mt-1 block text-xs text-gray-500">
                        Remaining {item.remainingQuantity.toLocaleString("th-TH")} / Reserved {item.reservedRemaining.toLocaleString("th-TH")}
                      </span>
                      <input
                        className="input mt-2"
                        type="number"
                        min="0"
                        max={item.reservedRemaining}
                        step="0.0001"
                        name={`delivery_quantity_${item.id}`}
                        defaultValue={item.reservedRemaining}
                      />
                    </label>
                  ))}
                </div>
                <label>
                  <span className="label">Notes</span>
                  <textarea className="input textarea" name="notes" placeholder="Delivery note, vehicle, receiver, or backorder note" />
                </label>
                <button className="btn-primary w-full">Post Delivery</button>
              </form>
            </div>
          )}

          <div className="card space-y-2 p-5">
            <div className="flex justify-between"><span>Subtotal</span><b>THB {money(order.subtotal)}</b></div>
            <div className="flex justify-between"><span>Discount</span><b>THB {money(order.discount_amount)}</b></div>
            <div className="flex justify-between"><span>Tax</span><b>THB {money(order.tax_amount)}</b></div>
            <div className="mt-3 flex justify-between border-t pt-3 text-xl"><span className="font-black">Total</span><b>THB {money(order.total_amount)}</b></div>
          </div>
        </aside>
      </section>
    </div>
  );
}
