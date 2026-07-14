import Link from "next/link";
import { LeadForm } from "@/components/crm/lead-form";
import { PageHeader } from "@/components/page-header";
import { saveLead } from "../../actions";

export default function Page() {
  return (
    <div>
      <PageHeader eyebrow="CRM" title="เพิ่ม Lead" description="บันทึกลูกค้าเป้าหมายเข้าสู่ Pipeline" />
      <div className="mb-4 mt-6"><Link className="btn-secondary" href="/crm">← กลับ CRM</Link></div>
      <LeadForm action={saveLead} />
    </div>
  );
}
