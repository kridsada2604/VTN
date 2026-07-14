import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentCompanyId } from "@/lib/current-company";
import { PageHeader } from "@/components/page-header";
import { FormCard } from "@/components/master-data/form-card";
import { StatusBadge } from "@/components/master-data/status-badge";
import { saveCustomer, toggleCustomer } from "./actions";

export default async function CustomersPage({ searchParams }: { searchParams: Promise<{ q?: string; edit?: string }> }) {
  const { q = "", edit = "" } = await searchParams; const supabase = await createClient(); const companyId = await getCurrentCompanyId();
  let query = supabase.from("customers").select("*").eq("company_id", companyId).order("code");
  if (q) query = query.or(`code.ilike.%${q}%,name.ilike.%${q}%,phone.ilike.%${q}%`);
  const { data: rows = [] } = await query;
  const editing = edit ? rows?.find((x) => x.id === edit) : undefined;
  return <div><PageHeader eyebrow="CRM" title="ลูกค้า" description="เพิ่ม แก้ไข ค้นหา และปิดใช้งานข้อมูลลูกค้า" />
    <div className="two-column-page mt-6"><section className="card table-wrap">
      <div className="p-4 border-b"><form className="search-bar"><input className="input" name="q" defaultValue={q} placeholder="ค้นหารหัส ชื่อ หรือเบอร์โทร"/><button className="btn-secondary" type="submit">ค้นหา</button>{q&&<Link className="btn-secondary" href="/customers">ล้าง</Link>}</form></div>
      <table className="data-table"><thead><tr><th>รหัส</th><th>ชื่อลูกค้า</th><th>โทรศัพท์</th><th>อีเมล</th><th>สถานะ</th><th>จัดการ</th></tr></thead><tbody>{rows?.map((x)=><tr key={x.id}><td className="font-bold">{x.code}</td><td>{x.name}</td><td>{x.phone||"-"}</td><td>{x.email||"-"}</td><td><StatusBadge active={x.is_active}/></td><td><div className="action-row"><Link className="btn-secondary btn-small" href={`/customers?edit=${x.id}`}>แก้ไข</Link><form action={toggleCustomer}><input type="hidden" name="id" value={x.id}/><input type="hidden" name="next" value={String(!x.is_active)}/><button className="btn-secondary btn-small">{x.is_active?"ปิด":"เปิด"}</button></form></div></td></tr>)}</tbody></table>
      {!rows?.length&&<p className="p-6 text-gray-500">ไม่พบข้อมูลลูกค้า</p>}</section>
      <FormCard title={editing?"แก้ไขลูกค้า":"เพิ่มลูกค้าใหม่"} description="รหัสลูกค้าต้องไม่ซ้ำในบริษัท"><form action={saveCustomer} className="form-grid"><input type="hidden" name="id" value={editing?.id||""}/><label><span className="label">รหัสลูกค้า *</span><input className="input" name="code" required defaultValue={editing?.code}/></label><label><span className="label">ชื่อลูกค้า *</span><input className="input" name="name" required defaultValue={editing?.name}/></label><label><span className="label">เลขผู้เสียภาษี</span><input className="input" name="tax_id" defaultValue={editing?.tax_id||""}/></label><label><span className="label">โทรศัพท์</span><input className="input" name="phone" defaultValue={editing?.phone||""}/></label><label className="full"><span className="label">อีเมล</span><input className="input" type="email" name="email" defaultValue={editing?.email||""}/></label><label className="full"><span className="label">ที่อยู่</span><textarea className="input textarea" name="address" defaultValue={editing?.address||""}/></label><div className="full action-row"><button className="btn-primary">{editing?"บันทึกการแก้ไข":"เพิ่มลูกค้า"}</button>{editing&&<Link className="btn-secondary" href="/customers">ยกเลิก</Link>}</div></form></FormCard>
    </div></div>;
}
