import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { getSalesOrderDetail } from "@/lib/services/sales/sales-order-service";
import { deliverSalesOrderAction, reserveSalesOrderAction } from "../actions";

const money = (value: number | string) => Number(value).toLocaleString("th-TH", { minimumFractionDigits: 2 });

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { order, items, deliveries, events, warehouses } = await getSalesOrderDetail(id);
  if (!order) notFound();
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div>
      <PageHeader eyebrow="SALES ORDER" title={order.document_no} description={`${order.customers?.[0]?.name ?? ""} · ${order.order_date}`} />
      <div className="mb-4 mt-6 flex flex-wrap gap-2">
        <Link className="btn-secondary" href="/sales/orders">← กลับรายการ</Link>
        {order.status === "CONFIRMED" && (
          <form action={reserveSalesOrderAction} className="flex gap-2">
            <input type="hidden" name="sales_order_id" value={order.id} />
            <select className="input" name="warehouse_id" defaultValue={order.warehouses?.[0] ? "" : ""} required>
              <option value="">เลือกคลัง</option>
              {warehouses.map((warehouse) => <option key={warehouse.id} value={warehouse.id}>{warehouse.code} - {warehouse.name}</option>)}
            </select>
            <button className="btn-primary">Reserve Stock</button>
          </form>
        )}
        {order.status === "RESERVED" && (
          <form action={deliverSalesOrderAction} className="flex gap-2">
            <input type="hidden" name="sales_order_id" value={order.id} />
            <input className="input" type="date" name="delivery_date" defaultValue={today} required />
            <button className="btn-primary">Delivery</button>
          </form>
        )}
      </div>

      <section className="card p-5">
        <div className="grid gap-4 md:grid-cols-4">
          <div><p className="label">สถานะ</p><p className="font-bold">{order.status}</p></div>
          <div><p className="label">คลัง</p><p className="font-bold">{order.warehouses?.[0]?.name ?? "-"}</p></div>
          <div><p className="label">วันส่งที่ต้องการ</p><p className="font-bold">{order.requested_delivery_date ?? "-"}</p></div>
          <div><p className="label">ยอดสุทธิ</p><p className="font-bold">฿{money(order.total_amount)}</p></div>
        </div>
      </section>

      <section className="card table-wrap mt-6">
        <table className="data-table">
          <thead><tr><th>สินค้า</th><th>รายละเอียด</th><th>จำนวน</th><th>จองแล้ว</th><th>ส่งแล้ว</th><th>ราคา</th><th>รวม</th></tr></thead>
          <tbody>{items.map((item) => <tr key={item.id}><td>{item.products?.[0]?.sku ?? "-"}</td><td>{item.description}</td><td>{Number(item.quantity).toLocaleString("th-TH")}</td><td>{Number(item.reserved_quantity).toLocaleString("th-TH")}</td><td>{Number(item.delivered_quantity).toLocaleString("th-TH")}</td><td>฿{money(item.unit_price)}</td><td className="font-bold">฿{money(item.line_total)}</td></tr>)}</tbody>
        </table>
      </section>

      <section className="mt-6 grid gap-4 xl:grid-cols-[1fr_360px]">
        <div className="card p-5">
          <p className="font-black">Deliveries</p>
          <div className="mt-3 space-y-2">{deliveries.map((delivery) => <div key={delivery.id} className="rounded-xl bg-slate-50 p-3"><b>{delivery.document_no}</b><p className="text-sm text-gray-500">{delivery.delivery_date} · {delivery.status}</p></div>)}</div>
          {!deliveries.length && <p className="mt-3 text-gray-500">ยังไม่มี Delivery</p>}
          <div className="mt-5 border-t pt-4">
            <p className="font-black">Timeline</p>
            <div className="mt-3 space-y-2">{events.map((event) => <div key={event.id} className="rounded-xl bg-slate-50 p-3"><b>{event.event_type}</b><p className="text-sm text-gray-500">{event.message ?? "-"} · {event.created_at}</p></div>)}</div>
          </div>
        </div>
        <div className="card space-y-2 p-5">
          <div className="flex justify-between"><span>ยอดก่อนส่วนลด</span><b>฿{money(order.subtotal)}</b></div>
          <div className="flex justify-between"><span>ส่วนลด</span><b>฿{money(order.discount_amount)}</b></div>
          <div className="flex justify-between"><span>ภาษี</span><b>฿{money(order.tax_amount)}</b></div>
          <div className="mt-3 flex justify-between border-t pt-3 text-xl"><span className="font-black">ยอดสุทธิ</span><b>฿{money(order.total_amount)}</b></div>
        </div>
      </section>
    </div>
  );
}
