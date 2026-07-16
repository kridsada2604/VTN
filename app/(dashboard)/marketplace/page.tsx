import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { getMarketplaceDashboard } from "@/lib/services/marketplace/marketplace-service";

const money = (value: number | string) => Number(value).toLocaleString("th-TH", { minimumFractionDigits: 2 });

export default async function Page() {
  const { channels, orders } = await getMarketplaceDashboard();
  const importedTotal = orders.reduce((sum, order) => sum + Number(order.total_amount), 0);
  const pendingOrders = orders.filter((order) => order.fulfillment_status === "PENDING").length;

  return (
    <div>
      <PageHeader
        eyebrow="MARKETPLACE"
        title="Marketplace"
        description="Central order management for Shopee, Lazada, TikTok, and online sales channels."
        action={
          <div className="flex flex-wrap gap-2">
            <Link className="btn-secondary" href="/marketplace/unmapped">Unmapped SKU</Link>
            <Link className="btn-secondary" href="/marketplace/channels/new">+ Channel</Link>
            <Link className="btn-primary" href="/marketplace/orders/new">Import Order</Link>
          </div>
        }
      />

      <section className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="card p-5">
          <p className="text-sm text-gray-500">Channels</p>
          <p className="mt-2 text-3xl font-black">{channels.length}</p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-gray-500">Imported Orders</p>
          <p className="mt-2 text-3xl font-black">{orders.length}</p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-gray-500">Total Amount</p>
          <p className="mt-2 text-3xl font-black">THB {money(importedTotal)}</p>
        </div>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[360px_1fr]">
        <div className="card table-wrap">
          <div className="border-b p-4">
            <h2 className="font-black">Channels</h2>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Shop</th>
                <th>Platform</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {channels.map((channel) => (
                <tr key={channel.id}>
                  <td>
                    <b>{channel.name}</b>
                    <p className="text-xs text-gray-500">{channel.shop_code}</p>
                  </td>
                  <td>{channel.platform}</td>
                  <td>{channel.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!channels.length && <p className="p-6 text-gray-500">No marketplace channels yet.</p>}
        </div>

        <div className="card table-wrap">
          <div className="flex items-center justify-between border-b p-4">
            <h2 className="font-black">Orders</h2>
            <span className="text-sm text-gray-500">Pending {pendingOrders}</span>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>No.</th>
                <th>External</th>
                <th>Channel</th>
                <th>Buyer</th>
                <th>Status</th>
                <th>Fulfillment</th>
                <th>Total</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td className="font-bold">{order.order_no}</td>
                  <td>{order.external_order_no}</td>
                  <td>{order.marketplace_channels?.[0]?.platform ?? "-"}</td>
                  <td>{order.buyer_name}</td>
                  <td>{order.status}</td>
                  <td>{order.fulfillment_status}</td>
                  <td>THB {money(order.total_amount)}</td>
                  <td><Link className="btn-secondary btn-small" href={`/marketplace/orders/${order.id}`}>Open</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
          {!orders.length && <p className="p-6 text-gray-500">No marketplace orders yet.</p>}
        </div>
      </section>
    </div>
  );
}
