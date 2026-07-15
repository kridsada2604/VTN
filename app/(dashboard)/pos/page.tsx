import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { getPosSales } from "@/lib/services/pos/pos-sale-service";

const money = (value: number | string) => Number(value).toLocaleString("th-TH", { minimumFractionDigits: 2 });

export default async function Page() {
  const sales = await getPosSales();
  const total = sales.reduce((sum, sale) => sum + Number(sale.total_amount), 0);

  return (
    <div>
      <PageHeader eyebrow="POS" title="Point of Sale" description="ขายหน้าร้าน รับชำระเงิน และตัดสต๊อกอัตโนมัติ" action={<Link className="btn-primary" href="/pos/sales/new">+ เปิดบิล POS</Link>} />
      <section className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="card p-5"><p className="text-sm text-gray-500">รายการขาย</p><p className="mt-2 text-3xl font-black">{sales.length}</p></div>
        <div className="card p-5"><p className="text-sm text-gray-500">ยอดขายรวม</p><p className="mt-2 text-3xl font-black">฿{money(total)}</p></div>
        <div className="card p-5"><p className="text-sm text-gray-500">สถานะ</p><p className="mt-2 text-3xl font-black text-emerald-600">Ready</p></div>
      </section>
      <section className="card table-wrap mt-6">
        <table className="data-table">
          <thead><tr><th>เลขที่</th><th>วันที่</th><th>ลูกค้า</th><th>คลัง</th><th>ชำระเงิน</th><th>ยอดสุทธิ</th><th>รับเงิน</th><th>เงินทอน</th><th /></tr></thead>
          <tbody>{sales.map((sale) => <tr key={sale.id}><td className="font-bold">{sale.sale_no}</td><td>{sale.sale_date}</td><td>{sale.customers?.[0]?.name ?? "ลูกค้าทั่วไป"}</td><td>{sale.warehouses?.[0]?.name ?? "-"}</td><td>{sale.payment_method}</td><td>฿{money(sale.total_amount)}</td><td>฿{money(sale.paid_amount)}</td><td>฿{money(sale.change_amount)}</td><td><Link className="btn-secondary btn-small" href={`/pos/sales/${sale.id}`}>เปิด</Link></td></tr>)}</tbody>
        </table>
        {!sales.length && <p className="p-6 text-gray-500">ยังไม่มีรายการ POS</p>}
      </section>
    </div>
  );
}
