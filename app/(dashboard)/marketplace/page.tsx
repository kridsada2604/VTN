import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { getMarketplaceDashboard } from "@/lib/services/marketplace/marketplace-service";
import { syncMarketplaceChannelAction } from "./actions";

const money = (value: number | string) => Number(value).toLocaleString("th-TH", { minimumFractionDigits: 2 });

export default async function Page() {
  const { channels, orders, syncLogs } = await getMarketplaceDashboard();
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
                    <p className="mt-1 text-xs text-gray-400">Last sync {channel.last_synced_at ?? "-"}</p>
                  </td>
                  <td>{channel.platform}</td>
                  <td>
                    <p>{channel.status}</p>
                    <p className="text-xs text-gray-500">{channel.sync_status}</p>
                    {channel.status === "ACTIVE" && (
                      <form action={syncMarketplaceChannelAction} className="mt-2">
                        <input type="hidden" name="channel_id" value={channel.id} />
                        <input type="hidden" name="trigger_source" value="MANUAL" />
                        <button className="btn-secondary btn-small">Sync</button>
                      </form>
                    )}
                  </td>
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

      <section className="card table-wrap mt-6">
        <div className="border-b p-4">
          <h2 className="font-black">Sync Logs</h2>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Channel</th>
              <th>Trigger</th>
              <th>Status</th>
              <th>Imported</th>
              <th>Started</th>
              <th>Message</th>
            </tr>
          </thead>
          <tbody>
            {syncLogs.map((log) => (
              <tr key={log.id}>
                <td>
                  <b>{log.marketplace_channels?.[0]?.name ?? "-"}</b>
                  <p className="text-xs text-gray-500">{log.marketplace_channels?.[0]?.platform ?? "-"}</p>
                </td>
                <td>{log.trigger_source}</td>
                <td>{log.status}</td>
                <td>{log.orders_imported}</td>
                <td>{log.started_at}</td>
                <td className="text-xs text-gray-500">{log.error_message ?? log.finished_at ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!syncLogs.length && <p className="p-6 text-gray-500">No marketplace sync logs yet.</p>}
      </section>
    </div>
  );
}
