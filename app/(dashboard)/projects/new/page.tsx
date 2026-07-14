import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { ProjectForm } from "@/components/projects/project-form";
import { getProjectFormOptions } from "@/lib/services/projects/project-service";
import { saveProject } from "../actions";

export default async function Page() {
  const { customers } = await getProjectFormOptions();
  return (
    <div>
      <PageHeader eyebrow="PROJECTS" title="สร้างโครงการ" description="กำหนดลูกค้า งบประมาณ และช่วงเวลาโครงการ" />
      <div className="mb-4 mt-6"><Link className="btn-secondary" href="/projects">← กลับรายการ</Link></div>
      <ProjectForm customers={customers} action={saveProject} />
    </div>
  );
}
