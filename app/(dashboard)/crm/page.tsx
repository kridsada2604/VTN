import Link from "next/link";
import { Activity, BadgeDollarSign, UserRoundPlus, UsersRound } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { getCrmDashboard } from "@/lib/services/crm/crm-service";
import { formatDocumentMoney } from "@/lib/services/documents/document-engine";

const statusLabel: Record<string, string> = {
  NEW: "ใหม่",
  CONTACTED: "ติดต่อแล้ว",
  QUALIFIED: "ผ่านการคัดกรอง",
  CONVERTED: "แปลงเป็นลูกค้า",
  LOST: "ไม่สำเร็จ",
};

export default async function Page() {
  const { leads, opportunities, activities } = await getCrmDashboard();
  const pipelineValue = opportunities.reduce((sum, opportunity) => sum + Number(opportunity.expected_value || 0), 0);

  return (
    <div>
      <PageHeader eyebrow="CRM" title="CRM" description="จัดการ Lead, Opportunity, Activity และ Pipeline" action={<Link className="btn-primary" href="/crm/leads/new">+ เพิ่ม Lead</Link>} />
      <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="card p-5"><UsersRound className="text-orange-600" /><p className="mt-3 text-sm text-gray-500">Leads</p><p className="mt-2 text-3xl font-black">{leads.length}</p></div>
        <div className="card p-5"><BadgeDollarSign className="text-orange-600" /><p className="mt-3 text-sm text-gray-500">Opportunities</p><p className="mt-2 text-3xl font-black">{opportunities.length}</p></div>
        <div className="card p-5"><Activity className="text-orange-600" /><p className="mt-3 text-sm text-gray-500">Activities</p><p className="mt-2 text-3xl font-black">{activities.length}</p></div>
        <div className="card p-5"><UserRoundPlus className="text-orange-600" /><p className="mt-3 text-sm text-gray-500">Pipeline Value</p><p className="mt-2 text-3xl font-black text-green-700">฿{formatDocumentMoney(pipelineValue)}</p></div>
      </section>

      <section className="mt-7 grid gap-6 xl:grid-cols-[1fr_420px]">
        <div className="card table-wrap">
          <div className="border-b p-4"><h2 className="font-black">Leads ล่าสุด</h2></div>
          <table className="data-table">
            <thead><tr><th>เลขที่</th><th>ชื่อ</th><th>บริษัท</th><th>ติดต่อ</th><th>Source</th><th>สถานะ</th></tr></thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id}><td className="font-bold">{lead.lead_no}</td><td>{lead.name}</td><td>{lead.company_name ?? "-"}</td><td>{lead.phone ?? lead.email ?? "-"}</td><td>{lead.source ?? "-"}</td><td>{statusLabel[lead.status] ?? lead.status}</td></tr>
              ))}
            </tbody>
          </table>
          {!leads.length && <p className="p-6 text-gray-500">ยังไม่มี Lead</p>}
        </div>

        <aside className="card p-5">
          <h2 className="font-black">Activities ถัดไป</h2>
          <div className="mt-4 space-y-3">
            {activities.map((activity) => (
              <div key={activity.id} className="rounded-xl border border-gray-200 p-3">
                <p className="font-bold">{activity.subject}</p>
                <p className="text-sm text-gray-500">{activity.activity_type} • {activity.due_at ? new Date(activity.due_at).toLocaleString("th-TH") : "ไม่ระบุเวลา"}</p>
              </div>
            ))}
            {!activities.length && <p className="text-sm text-gray-500">ยังไม่มีกิจกรรม</p>}
          </div>
        </aside>
      </section>
    </div>
  );
}
