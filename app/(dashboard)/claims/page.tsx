import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { getClaims } from "@/lib/services/claims/claim-service";

const statusLabel: Record<string, string> = {
  OPEN: "เปิด",
  IN_REVIEW: "ตรวจสอบ",
  APPROVED: "อนุมัติ",
  REJECTED: "ปฏิเสธ",
  RESOLVED: "แก้ไขแล้ว",
  CLOSED: "ปิด",
};

export default async function Page() {
  const claims = await getClaims();

  return (
    <div>
      <PageHeader eyebrow="CLAIMS" title="Claim" description="จัดการเคลมสินค้า บริการ Warranty Return และ Refund" action={<Link className="btn-primary" href="/claims/new">+ สร้างเคลม</Link>} />
      <section className="card table-wrap mt-6">
        <table className="data-table">
          <thead><tr><th>เลขที่</th><th>วันที่</th><th>ลูกค้า</th><th>สินค้า</th><th>ประเภท</th><th>Priority</th><th>สถานะ</th><th>หัวข้อ</th><th /></tr></thead>
          <tbody>{claims.map((claim) => <tr key={claim.id}><td className="font-bold">{claim.claim_no}</td><td>{claim.claim_date}</td><td>{claim.customers?.[0]?.name ?? "-"}</td><td>{claim.products?.[0]?.name ?? "-"}</td><td>{claim.claim_type}</td><td>{claim.priority}</td><td>{statusLabel[claim.status] ?? claim.status}</td><td>{claim.subject}</td><td><Link className="btn-secondary btn-small" href={`/claims/${claim.id}`}>เปิด</Link></td></tr>)}</tbody>
        </table>
        {!claims.length && <p className="p-6 text-gray-500">ยังไม่มี Claim</p>}
      </section>
    </div>
  );
}
