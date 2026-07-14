import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { formatDocumentMoney } from "@/lib/services/documents/document-engine";
import { getProjectDetail } from "@/lib/services/projects/project-service";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { project, tasks } = await getProjectDetail(id);
  if (!project) notFound();

  return (
    <div>
      <PageHeader eyebrow="PROJECT" title={project.name} description={`${project.project_no} • ${project.status}`} />
      <div className="my-6"><Link className="btn-secondary" href="/projects">← กลับรายการ</Link></div>
      <section className="grid gap-4 sm:grid-cols-3">
        <div className="card p-5"><p className="text-sm text-gray-500">งบประมาณ</p><p className="mt-2 text-3xl font-black">฿{formatDocumentMoney(project.budget_amount)}</p></div>
        <div className="card p-5"><p className="text-sm text-gray-500">ต้นทุนจริง</p><p className="mt-2 text-3xl font-black text-orange-700">฿{formatDocumentMoney(project.actual_cost)}</p></div>
        <div className="card p-5"><p className="text-sm text-gray-500">รายได้</p><p className="mt-2 text-3xl font-black text-green-700">฿{formatDocumentMoney(project.revenue_amount)}</p></div>
      </section>
      <section className="card table-wrap mt-7">
        <div className="border-b p-4"><h2 className="font-black">Tasks</h2></div>
        <table className="data-table">
          <thead><tr><th>งาน</th><th>สถานะ</th><th>กำหนด</th><th>ชั่วโมงประมาณ</th><th>ชั่วโมงจริง</th></tr></thead>
          <tbody>{tasks.map((task) => <tr key={task.id}><td className="font-bold">{task.title}</td><td>{task.status}</td><td>{task.due_date ?? "-"}</td><td>{task.estimated_hours}</td><td>{task.actual_hours}</td></tr>)}</tbody>
        </table>
        {!tasks.length && <p className="p-6 text-gray-500">ยังไม่มี task</p>}
      </section>
    </div>
  );
}
