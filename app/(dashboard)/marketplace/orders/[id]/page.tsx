import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { getMarketplaceOrderDetail } from "@/lib/services/marketplace/marketplace-service";
import { createMarketplaceFeeAction } from "../../actions";

const money = (value: number | string) => Number(value).toLocaleString("th-TH", { minimumFractionDigits: 2 });

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { order, items, fees, events } = await getMarketplaceOrderDetail(id);
  if (!order) notFound();

  const feeTotal = fees.reduce((sum, fee) => sum + Number(fee.amount), 0);
  const netAfterFees = Number(order.total_amount) - feeTotal;

  return (
    <div>
      <PageHeader
        eyebrow="MARKETPLACE ORDER"
        title={order.order_no}
        description={`${order.marketplace_channels?.[0]?.platform ?? "Marketplace"} / ${order.external_order_no}`}
        action={<Link className="btn-secondary" href="/marketplace">Back to Marketplace</Link>}
      />

      <section className="card p-5 mt-6">
        <div className="grid gap-4 md:grid-cols-4">
          <div><p className="label">Buyer</p><p className="font-bold">{order.buyer_name}</p></div>
          <div><p className="label">Status</p><p className="font-bold">{order.status}</p></div>
          <div><p className="label">Payment</p><p className="font-bold">{order.payment_status}</p></div>
          <div><p className="label">Fulfillment</p><p className="font-bold">{order.fulfillment_status}</p></div>
        </div>
      </section>

      <section className="card table-wrap mt-6">
        <table className="data-table">
          <thead>
            <tr>
              <th>Marketplace SKU</th>
              <th>Product</th>
              <th>Description</th>
              <th>Qty</th>
              <th>Price</th>
              <th>Discount</th>
              <th>Total</th>
              <th>Mapping</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>{item.marketplace_sku}</td>
                <td>{item.products?.[0]?.sku ?? "-"}</td>
                <td>{item.description}</td>
                <td>{Number(item.quantity).toLocaleString("th-TH")}</td>
                <td>THB {money(item.unit_price)}</td>
                <td>THB {money(item.line_discount)}</td>
                <td className="font-bold">THB {money(item.line_total)}</td>
                <td>{item.mapping_status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <div className="card p-5">
            <p className="label">Shipping Address</p>
            <p>{order.shipping_address ?? "-"}</p>
          </div>

          <div className="card table-wrap">
            <div className="border-b p-4">
              <h2 className="font-black">Marketplace Fees</h2>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Notes</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {fees.map((fee) => (
                  <tr key={fee.id}>
                    <td>{fee.fee_type}</td>
                    <td className="font-bold">THB {money(fee.amount)}</td>
                    <td>{fee.notes ?? "-"}</td>
                    <td>{fee.created_at}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!fees.length && <p className="p-6 text-gray-500">No marketplace fees recorded.</p>}
          </div>

          <div className="card p-5">
            <p className="font-black">Timeline</p>
            <div className="mt-3 space-y-2">
              {events.map((event) => (
                <div key={event.id} className="rounded-xl bg-slate-50 p-3">
                  <p className="font-bold">{event.event_type}</p>
                  <p className="text-sm text-gray-500">{event.message ?? "-"} / {event.created_at}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside className="space-y-6">
          <div className="card space-y-2 p-5">
            <div className="flex justify-between"><span>Subtotal</span><b>THB {money(order.subtotal)}</b></div>
            <div className="flex justify-between"><span>Discount</span><b>THB {money(order.discount_amount)}</b></div>
            <div className="flex justify-between"><span>Shipping</span><b>THB {money(order.shipping_fee)}</b></div>
            <div className="flex justify-between"><span>Tax</span><b>THB {money(order.tax_amount)}</b></div>
            <div className="flex justify-between"><span>Marketplace Fees</span><b>THB {money(feeTotal)}</b></div>
            <div className="mt-3 flex justify-between border-t pt-3 text-xl"><span className="font-black">Net After Fees</span><b>THB {money(netAfterFees)}</b></div>
          </div>

          <div className="card p-5">
            <h2 className="font-black">Record Fee</h2>
            <form action={createMarketplaceFeeAction} className="mt-4 space-y-3">
              <input type="hidden" name="order_id" value={order.id} />
              <label>
                <span className="label">Fee type</span>
                <select className="input" name="fee_type" defaultValue="COMMISSION">
                  <option value="COMMISSION">Commission</option>
                  <option value="PAYMENT">Payment</option>
                  <option value="SHIPPING">Shipping</option>
                  <option value="VOUCHER">Voucher</option>
                  <option value="SERVICE">Service</option>
                  <option value="OTHER">Other</option>
                </select>
              </label>
              <label>
                <span className="label">Amount</span>
                <input className="input" type="number" min="0.01" step="0.01" name="amount" required />
              </label>
              <label>
                <span className="label">Notes</span>
                <textarea className="input textarea" name="notes" placeholder="Marketplace statement reference or fee notes" />
              </label>
              <button className="btn-primary w-full">Save Fee</button>
            </form>
          </div>
        </aside>
      </section>
    </div>
  );
}
