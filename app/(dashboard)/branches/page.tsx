import { PageHeader } from "@/components/page-header";
import { getBranches } from "@/lib/services/core/branch-service";

export default async function BranchesPage() {
  const rows = await getBranches();

  return (
    <div>
      <PageHeader eyebrow="CORE" title="สาขา" description="สาขาของบริษัทปัจจุบันสำหรับเอกสาร คลัง และสิทธิ์ผู้ใช้งาน" />
      <section className="card table-wrap mt-6">
        <table className="data-table">
          <thead>
            <tr><th>รหัส</th><th>ชื่อสาขา</th><th>เลขสาขา</th><th>สถานะ</th></tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="font-bold">{row.code}</td>
                <td>{row.name}</td>
                <td>{row.branch_number ?? "-"}</td>
                <td>{row.is_active ? "ใช้งาน" : "ปิดใช้งาน"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && <p className="p-6 text-gray-500">ยังไม่มีข้อมูลสาขา</p>}
      </section>
    </div>
  );
}
