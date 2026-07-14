import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { formatDocumentMoney } from "@/lib/services/documents/document-engine";
import { getPurchaseOrders } from "@/lib/services/purchase/purchase-order-service";

export default async function Page() {
  const rows = await getPurchaseOrders();

  return (
    <div>
      <PageHeader eyebrow="PURCHASE" title="ใบสั่งซื้อ" description="สร้างและติดตามใบสั่งซื้อ Supplier" action={<Link className="btn-primary" href="/purchase/orders/new">+ สร้าง PO</Link>} />
      <section className="card table-wrap mt-6">
        <table className="data-table">
          <thead><tr><th>เลขที่</th><th>วันที่</th><th>Supplier</th><th>สถานะ</th><th>กำหนดรับ</th><th>ยอดรวม</th><th /></tr></thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="font-bold">{row.document_no}</td>
                <td>{row.order_date}</td>
                <td>{row.suppliers?.[0]?.name ?? "-"}</td>
                <td>{row.status}</td>
                <td>{row.expected_date ?? "-"}</td>
                <td>฿{formatDocumentMoney(row.total_amount)}</td>
                <td><Link className="btn-secondary btn-small" href={`/purchase/orders/${row.id}`}>เปิด</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && <p className="p-6 text-gray-500">ยังไม่มีใบสั่งซื้อ</p>}
      </section>
    </div>
  );
}
