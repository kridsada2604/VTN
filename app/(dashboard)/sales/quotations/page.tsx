import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { getQuotations } from "@/lib/services/sales/quotation-service";

const label: Record<string, string> = {
  DRAFT: "ร่าง",
  SENT: "ส่งแล้ว",
  ACCEPTED: "อนุมัติ",
  REJECTED: "ปฏิเสธ",
  CANCELLED: "ยกเลิก",
};

export default async function Page() {
  const rows = await getQuotations();

  return (
    <div>
      <PageHeader eyebrow="SALES" title="ใบเสนอราคา" description="สร้าง ติดตาม และเปลี่ยนสถานะใบเสนอราคา" />
      <div className="my-6"><Link href="/sales/quotations/new" className="btn-primary">+ สร้างใบเสนอราคา</Link></div>
      <section className="card table-wrap">
        <table className="data-table">
          <thead><tr><th>เลขที่</th><th>วันที่</th><th>ลูกค้า</th><th>สถานะ</th><th>ยอดรวม</th><th /></tr></thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="font-bold">{row.document_no}</td>
                <td>{row.quotation_date}</td>
                <td>{row.customers?.[0]?.name ?? "-"}</td>
                <td><span className="status-badge status-active">{label[row.status] ?? row.status}</span></td>
                <td>฿{Number(row.total_amount).toLocaleString("th-TH", { minimumFractionDigits: 2 })}</td>
                <td><Link className="btn-secondary btn-small" href={`/sales/quotations/${row.id}`}>เปิด</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && <p className="p-6 text-gray-500">ยังไม่มีใบเสนอราคา</p>}
      </section>
    </div>
  );
}
