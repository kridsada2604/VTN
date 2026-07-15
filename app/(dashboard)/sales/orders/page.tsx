import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { getSalesOrders } from "@/lib/services/sales/sales-order-service";

const money = (value: number | string) => Number(value).toLocaleString("th-TH", { minimumFractionDigits: 2 });

export default async function Page() {
  const orders = await getSalesOrders();

  return (
    <div>
      <PageHeader eyebrow="SALES" title="Sales Order" description="ยืนยันคำสั่งขาย จองสต๊อก และส่งของ" action={<Link className="btn-primary" href="/sales/orders/new">+ สร้าง Sales Order</Link>} />
      <section className="card table-wrap mt-6">
        <table className="data-table">
          <thead><tr><th>เลขที่</th><th>วันที่</th><th>ลูกค้า</th><th>คลัง</th><th>วันส่ง</th><th>สถานะ</th><th>ยอดรวม</th><th /></tr></thead>
          <tbody>{orders.map((order) => <tr key={order.id}><td className="font-bold">{order.document_no}</td><td>{order.order_date}</td><td>{order.customers?.[0]?.name ?? "-"}</td><td>{order.warehouses?.[0]?.name ?? "-"}</td><td>{order.requested_delivery_date ?? "-"}</td><td>{order.status}</td><td>฿{money(order.total_amount)}</td><td><Link className="btn-secondary btn-small" href={`/sales/orders/${order.id}`}>เปิด</Link></td></tr>)}</tbody>
        </table>
        {!orders.length && <p className="p-6 text-gray-500">ยังไม่มี Sales Order</p>}
      </section>
    </div>
  );
}
