"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentCompanyId } from "@/lib/current-company";

const text=(fd:FormData,k:string)=>String(fd.get(k)??"").trim();
export async function saveQuotation(fd:FormData){
 const supabase=await createClient(); const companyId=await getCurrentCompanyId();
 const items=JSON.parse(text(fd,"items")||"[]") as Array<{product_id?:string;description:string;quantity:number;unit_price:number;discount_percent:number;tax_rate:number}>;
 if(!text(fd,"customer_id")||!items.length) throw new Error("กรุณาเลือกลูกค้าและเพิ่มอย่างน้อย 1 รายการ");
 const {data:no,error:noErr}=await supabase.rpc("next_document_number",{p_company_id:companyId,p_document_type:"QUOTATION",p_prefix:"QT"}); if(noErr) throw noErr;
 let subtotal=0,discount=0,tax=0,total=0;
 const computed=items.map((x,i)=>{const s=Number(x.quantity)*Number(x.unit_price); const d=s*Number(x.discount_percent||0)/100; const taxable=s-d; const t=taxable*Number(x.tax_rate||0)/100; const z=taxable+t; subtotal+=s;discount+=d;tax+=t;total+=z; return {...x,line_subtotal:s,line_discount:d,line_tax:t,line_total:z,sort_order:i};});
 const {data:q,error}=await supabase.from("sales_quotations").insert({company_id:companyId,customer_id:text(fd,"customer_id"),document_no:no,quotation_date:text(fd,"quotation_date"),valid_until:text(fd,"valid_until")||null,notes:text(fd,"notes")||null,subtotal,discount_amount:discount,tax_amount:tax,total_amount:total}).select("id").single(); if(error) throw error;
 const {error:itemErr}=await supabase.from("sales_quotation_items").insert(computed.map(x=>({quotation_id:q.id,product_id:x.product_id||null,description:x.description,quantity:x.quantity,unit_price:x.unit_price,discount_percent:x.discount_percent,tax_rate:x.tax_rate,line_subtotal:x.line_subtotal,line_discount:x.line_discount,line_tax:x.line_tax,line_total:x.line_total,sort_order:x.sort_order}))); if(itemErr) throw itemErr;
 revalidatePath("/sales/quotations"); redirect(`/sales/quotations/${q.id}`);
}

export async function updateQuotationStatus(fd:FormData){
 const supabase=await createClient(); const companyId=await getCurrentCompanyId(); const id=text(fd,"id"); const status=text(fd,"status");
 const {error}=await supabase.from("sales_quotations").update({status}).eq("id",id).eq("company_id",companyId); if(error) throw error;
 revalidatePath(`/sales/quotations/${id}`); revalidatePath("/sales/quotations");
}
