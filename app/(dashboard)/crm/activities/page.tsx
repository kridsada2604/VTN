import { PageHeader } from "@/components/page-header";
import { getCrmDashboard } from "@/lib/services/crm/crm-service";

export default async function Page() {
  const { activities } = await getCrmDashboard();

  return (
    <div>
      <PageHeader eyebrow="CRM" title="Activities" description="งาน โทร อีเมล นัดหมาย และบันทึกที่ต้องติดตาม" />
      <section className="card table-wrap mt-6">
        <table className="data-table">
          <thead><tr><th>ประเภท</th><th>หัวข้อ</th><th>กำหนด</th><th>สถานะ</th><th>หมายเหตุ</th></tr></thead>
          <tbody>{activities.map((activity) => <tr key={activity.id}><td>{activity.activity_type}</td><td className="font-bold">{activity.subject}</td><td>{activity.due_at ? new Date(activity.due_at).toLocaleString("th-TH") : "-"}</td><td>{activity.completed_at ? "เสร็จแล้ว" : "เปิดอยู่"}</td><td>{activity.notes ?? "-"}</td></tr>)}</tbody>
        </table>
        {!activities.length && <p className="p-6 text-gray-500">ยังไม่มีกิจกรรม</p>}
      </section>
    </div>
  );
}
