import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { getJournalEntries } from "@/lib/services/accounting/accounting-service";

export default async function Page() {
  const rows = await getJournalEntries();

  return (
    <div>
      <PageHeader eyebrow="ACCOUNTING" title="สมุดรายวัน" description="รายการ Journal Entry ที่ถูกบันทึกในระบบ" action={<Link className="btn-primary" href="/accounting/journal/new">+ Manual Journal</Link>} />
      <section className="card table-wrap mt-6">
        <table className="data-table">
          <thead>
            <tr>
              <th>เลขที่</th>
              <th>วันที่</th>
              <th>Source</th>
              <th>สถานะ</th>
              <th>Memo</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="font-bold">{row.document_no}</td>
                <td>{row.entry_date}</td>
                <td>{row.source_type ?? "-"}</td>
                <td>{row.status}</td>
                <td>{row.memo ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && <p className="p-6 text-gray-500">ยังไม่มี Journal Entry</p>}
      </section>
    </div>
  );
}
