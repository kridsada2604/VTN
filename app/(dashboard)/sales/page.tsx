import Link from "next/link";
import { FileText, ShoppingBag, Receipt, CreditCard, TrendingUp, CircleDollarSign } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import {createClient} from "@/lib/supabase/server";
import {getCurrentCompanyId} from "@/lib/current-company";

const modules=[["/sales/quotations","ใบเสนอราคา","สร้างและติดตามใบเสนอราคา",FileText,true],["#","ใบสั่งขาย","รับคำสั่งซื้อก่อนตัดสต๊อก",ShoppingBag,false],["#","ใบแจ้งหนี้","สร้างลูกหนี้และเอกสารภาษี",Receipt,false],["#","รับชำระเงิน","บันทึกเงินสด โอน และ QR",CreditCard,false]] as const;
export default async function Page(){
 const s=await createClient(),companyId=await getCurrentCompanyId();
 const {data=[]}=await s.from("sales_quotations").select("status,total_amount,quotation_date").eq("company_id",companyId);
 const rows=data??[]; const total=rows.reduce((a,x)=>a+Number(x.total_amount||0),0); const accepted=rows.filter(x=>x.status==="ACCEPTED").reduce((a,x)=>a+Number(x.total_amount||0),0); const pending=rows.filter(x=>["DRAFT","SENT"].includes(x.status)).length;
 return <div><PageHeader eyebrow="SALES" title="การขาย" description="ภาพรวมงานขายและเอกสารทั้งหมดในที่เดียว"/>
 <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><div className="card p-5"><p className="text-sm text-gray-500">ใบเสนอราคาทั้งหมด</p><p className="mt-2 text-3xl font-black">{rows.length}</p></div><div className="card p-5"><p className="text-sm text-gray-500">มูลค่ารวม</p><p className="mt-2 text-3xl font-black">฿{total.toLocaleString("th-TH",{maximumFractionDigits:0})}</p></div><div className="card p-5"><p className="text-sm text-gray-500">มูลค่าที่อนุมัติ</p><p className="mt-2 text-3xl font-black text-green-700">฿{accepted.toLocaleString("th-TH",{maximumFractionDigits:0})}</p></div><div className="card p-5"><p className="text-sm text-gray-500">รอติดตาม</p><p className="mt-2 text-3xl font-black text-amber-700">{pending}</p></div></section>
 <section className="module-grid mt-7">{modules.map(([href,t,d,I,ready])=><Link key={t} href={href} className="card module-link p-5"><I className="text-orange-600"/><h2 className="mt-4 font-black">{t}</h2><p className="mt-2 text-sm text-gray-500">{d}</p><span className={`mt-4 inline-block rounded-full px-3 py-1 text-xs font-bold ${ready?"bg-green-100 text-green-800":"bg-amber-100 text-amber-800"}`}>{ready?"ใช้งานได้":"กำลังพัฒนา"}</span></Link>)}</section>
 <section className="mt-7 grid gap-4 lg:grid-cols-2"><div className="card p-5"><div className="flex items-center gap-3"><TrendingUp className="text-orange-600"/><h2 className="font-black">ขั้นตอนการขาย</h2></div><p className="mt-3 text-sm text-gray-500">ใบเสนอราคา → ใบสั่งขาย → ใบแจ้งหนี้ → รับชำระเงิน</p></div><div className="card p-5"><div className="flex items-center gap-3"><CircleDollarSign className="text-orange-600"/><h2 className="font-black">บัญชีอัตโนมัติ</h2></div><p className="mt-3 text-sm text-gray-500">จะเริ่มเชื่อมลูกหนี้ รายได้ ภาษี และรับชำระใน Sprint ถัดไป</p></div></section>
 </div>
}
