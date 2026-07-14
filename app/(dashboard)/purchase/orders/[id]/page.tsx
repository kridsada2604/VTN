import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { PrintButton } from "@/components/sales/print-button";
import { formatDocumentMoney } from "@/lib/services/documents/document-engine";
import { getPurchaseOrderDetail } from "@/lib/services/purchase/purchase-order-service";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { order, items } = await getPurchaseOrderDetail(id);
  if (!order) notFound();
  const supplier = order.suppliers?.[0];

  return (
    <div>
      <PageHeader eyebrow="PURCHASE ORDER" title={order.document_no} description={`${supplier?.name ?? ""} • ${order.order_date}`} />
      <div className="action-row my-6 print:hidden"><Link className="btn-secondary" href="/purchase/orders">← กลับรายการ</Link><PrintButton /></div>
      <section className="card p-5 print:border-0 print:shadow-none">
        <div className="mb-7 flex items-start justify-between gap-4">
          <div><p className="text-2xl font-black"><span className="text-orange-600">VTN</span> Business</p><p className="text-sm text-gray-500">ใบสั่งซื้อ / Purchase Order</p></div>
          <div className="text-right"><p className="text-xl font-black">{order.document_no}</p><p className="text-sm text-gray-500">สถานะ: {order.status}</p></div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div><p className="text-sm text-gray-500">Supplier</p><p className="font-bold">{supplier?.name}</p></div>
          <div><p className="text-sm text-gray-500">เลขผู้เสียภาษี</p><p className="font-bold">{supplier?.tax_id ?? "-"}</p></div>
          <div><p className="text-sm text-gray-500">วันที่</p><p className="font-bold">{order.order_date}</p></div>
          <div><p className="text-sm text-gray-500">กำหนดรับ</p><p className="font-bold">{order.expected_date ?? "-"}</p></div>
        </div>
        <div className="table-wrap mt-6">
          <table className="data-table">
            <thead><tr><th>รายละเอียด</th><th>จำนวน</th><th>ต้นทุน</th><th>ส่วนลด</th><th>ภาษี</th><th>รวม</th></tr></thead>
            <tbody>{items.map((item) => <tr key={item.id}><td>{item.description}</td><td>{item.quantity}</td><td>{formatDocumentMoney(item.unit_cost)}</td><td>{formatDocumentMoney(item.line_discount)}</td><td>{formatDocumentMoney(item.line_tax)}</td><td className="font-bold">{formatDocumentMoney(item.line_total)}</td></tr>)}</tbody>
          </table>
        </div>
        <div className="ml-auto mt-6 max-w-sm space-y-2 text-right">
          <p>ยอดก่อนลด: ฿{formatDocumentMoney(order.subtotal)}</p>
          <p>ส่วนลด: ฿{formatDocumentMoney(order.discount_amount)}</p>
          <p>ภาษี: ฿{formatDocumentMoney(order.tax_amount)}</p>
          <p className="text-2xl font-black">รวม ฿{formatDocumentMoney(order.total_amount)}</p>
        </div>
      </section>
    </div>
  );
}
