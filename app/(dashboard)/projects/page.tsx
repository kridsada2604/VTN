import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { formatDocumentMoney } from "@/lib/services/documents/document-engine";
import { getProjects } from "@/lib/services/projects/project-service";

export default async function Page() {
  const projects = await getProjects();
  const budgetTotal = projects.reduce((sum, project) => sum + Number(project.budget_amount || 0), 0);
  const actualTotal = projects.reduce((sum, project) => sum + Number(project.actual_cost || 0), 0);

  return (
    <div>
      <PageHeader eyebrow="PROJECTS" title="Projects" description="บริหารโครงการ งบประมาณ ต้นทุน และงาน" action={<Link className="btn-primary" href="/projects/new">+ สร้างโครงการ</Link>} />
      <section className="mt-7 grid gap-4 sm:grid-cols-3">
        <div className="card p-5"><p className="text-sm text-gray-500">โครงการทั้งหมด</p><p className="mt-2 text-3xl font-black">{projects.length}</p></div>
        <div className="card p-5"><p className="text-sm text-gray-500">งบประมาณรวม</p><p className="mt-2 text-3xl font-black text-green-700">฿{formatDocumentMoney(budgetTotal)}</p></div>
        <div className="card p-5"><p className="text-sm text-gray-500">ต้นทุนจริง</p><p className="mt-2 text-3xl font-black text-orange-700">฿{formatDocumentMoney(actualTotal)}</p></div>
      </section>
      <section className="card table-wrap mt-7">
        <table className="data-table">
          <thead><tr><th>เลขที่</th><th>โครงการ</th><th>ลูกค้า</th><th>สถานะ</th><th>วันที่</th><th>งบ</th><th>ต้นทุน</th><th /></tr></thead>
          <tbody>{projects.map((project) => <tr key={project.id}><td className="font-bold">{project.project_no}</td><td>{project.name}</td><td>{project.customers?.[0]?.name ?? "-"}</td><td>{project.status}</td><td>{project.start_date ?? "-"} → {project.end_date ?? "-"}</td><td>฿{formatDocumentMoney(project.budget_amount)}</td><td>฿{formatDocumentMoney(project.actual_cost)}</td><td><Link className="btn-secondary btn-small" href={`/projects/${project.id}`}>เปิด</Link></td></tr>)}</tbody>
        </table>
        {!projects.length && <p className="p-6 text-gray-500">ยังไม่มีโครงการ</p>}
      </section>
    </div>
  );
}
