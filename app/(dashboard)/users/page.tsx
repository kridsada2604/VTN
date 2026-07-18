import { PageHeader } from "@/components/page-header";
import { getCompanyUsers } from "@/lib/services/system/user-service";

export default async function UsersPage() {
  const rows = await getCompanyUsers();

  return (
    <div>
      <PageHeader eyebrow="SYSTEM" title="ผู้ใช้งานและสิทธิ์" description="ผู้ใช้งานในบริษัท บทบาท สาขา และสถานะบัญชี" />
      <section className="card table-wrap mt-6">
        <table className="data-table">
          <thead>
            <tr>
              <th>ชื่อ</th>
              <th>อีเมล</th>
              <th>บทบาท</th>
              <th>สาขา</th>
              <th>สถานะ</th>
              <th>เข้าร่วมเมื่อ</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const profile = row.profiles?.[0];
              const role = row.roles?.[0];
              const branch = row.branches?.[0];
              return (
                <tr key={row.id}>
                  <td className="font-bold">{profile?.full_name || "-"}</td>
                  <td>{profile?.email ?? "-"}</td>
                  <td><span className="status-badge status-active">{role?.name ?? role?.code ?? "-"}</span></td>
                  <td>{branch ? `${branch.code} - ${branch.name}` : "ทุกสาขา"}</td>
                  <td>{profile?.is_active ? "ใช้งาน" : "ปิดใช้งาน"}</td>
                  <td>{new Date(row.created_at).toLocaleDateString("th-TH")}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!rows.length && <p className="p-6 text-gray-500">ยังไม่มีผู้ใช้งานในบริษัทนี้</p>}
      </section>
    </div>
  );
}
