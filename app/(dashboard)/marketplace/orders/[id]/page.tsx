import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { getMarketplaceOrderDetail } from "@/lib/services/marketplace/marketplace-service";

const money = (value: number | string) => Number(value).toLocaleString("th-TH", { minimumFractionDigits: 2 });

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { order, items, events } = await getMarketplaceOrderDetail(id);
  if (!order) notFound();

  return (
    <div>
      <PageHeader eyebrow="MARKETPLACE ORDER" title={order.order_no} description={`${order.marketplace_channels?.[0]?.platform ?? "Marketplace"} · ${order.external_order_no}`} />
      <div className="mb-4 mt-6"><Link className="btn-secondary" href="/marketplace">← กลับ Marketplace</Link></div>
      <section className="card p-5">
        <div className="grid gap-4 md:grid-cols-4">
          <div><p className="label">ลูกค้า</p><p className="font-bold">{order.buyer_name}</p></div>
          <div><p className="label">สถานะ</p><p className="font-bold">{order.status}</p></div>
          <div><p className="label">Payment</p><p className="font-bold">{order.payment_status}</p></div>
          <div><p className="label">Fulfillment</p><p className="font-bold">{order.fulfillment_status}</p></div>
        </div>
      </section>
      <section className="card table-wrap mt-6">
        <table className="data-table">
          <thead><tr><th>Marketplace SKU</th><th>สินค้าในระบบ</th><th>รายละเอียด</th><th>จำนวน</th><th>ราคา</th><th>ส่วนลด</th><th>รวม</th><th>Mapping</th></tr></thead>
          <tbody>{items.map((item) => <tr key={item.id}><td>{item.marketplace_sku}</td><td>{item.products?.[0]?.sku ?? "-"}</td><td>{item.description}</td><td>{Number(item.quantity).toLocaleString("th-TH")}</td><td>฿{money(item.unit_price)}</td><td>฿{money(item.line_discount)}</td><td className="font-bold">฿{money(item.line_total)}</td><td>{item.mapping_status}</td></tr>)}</tbody>
        </table>
      </section>
      <section className="mt-6 grid gap-4 xl:grid-cols-[1fr_360px]">
        <div className="card p-5">
          <p className="label">ที่อยู่จัดส่ง</p>
          <p>{order.shipping_address ?? "-"}</p>
          <div className="mt-5 border-t pt-4">
            <p className="font-black">Timeline</p>
            <div className="mt-3 space-y-2">{events.map((event) => <div key={event.id} className="rounded-xl bg-slate-50 p-3"><p className="font-bold">{event.event_type}</p><p className="text-sm text-gray-500">{event.message ?? "-"} · {event.created_at}</p></div>)}</div>
          </div>
        </div>
        <div className="card space-y-2 p-5">
          <div className="flex justify-between"><span>ยอดสินค้า</span><b>฿{money(order.subtotal)}</b></div>
          <div className="flex justify-between"><span>ส่วนลด</span><b>฿{money(order.discount_amount)}</b></div>
          <div className="flex justify-between"><span>ค่าส่ง</span><b>฿{money(order.shipping_fee)}</b></div>
          <div className="flex justify-between"><span>ภาษี</span><b>฿{money(order.tax_amount)}</b></div>
          <div className="mt-3 flex justify-between border-t pt-3 text-xl"><span className="font-black">ยอดสุทธิ</span><b>฿{money(order.total_amount)}</b></div>
        </div>
      </section>
    </div>
  );
}
