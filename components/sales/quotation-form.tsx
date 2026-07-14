"use client";
import {useEffect,useMemo,useState} from "react";

type Customer={id:string;code:string;name:string};
type Product={id:string;sku:string;name:string;selling_price:number};
type Item={product_id:string;description:string;quantity:number;unit_price:number;discount_percent:number;tax_rate:number};
type Draft={customer_id:string;quotation_date:string;valid_until:string;salesperson:string;project_name:string;payment_terms:string;currency_code:string;notes:string;items:Item[]};
const emptyItem:Item={product_id:"",description:"",quantity:1,unit_price:0,discount_percent:0,tax_rate:7};
const draftKey="vtn:quotation-draft:v1";

export function QuotationForm({customers,products,action}:{customers:Customer[];products:Product[];action:(fd:FormData)=>void}){
 const today=new Date().toISOString().slice(0,10);
 const [draft,setDraft]=useState<Draft>({customer_id:"",quotation_date:today,valid_until:"",salesperson:"",project_name:"",payment_terms:"ชำระภายใน 30 วัน",currency_code:"THB",notes:"",items:[emptyItem]});
 const [restored,setRestored]=useState(false);
 useEffect(()=>{const timer=window.setTimeout(()=>{try{const saved=localStorage.getItem(draftKey);if(saved){setDraft(JSON.parse(saved));setRestored(true)}}catch{}},0);return()=>window.clearTimeout(timer)},[]);
 useEffect(()=>{const t=setTimeout(()=>{try{localStorage.setItem(draftKey,JSON.stringify(draft))}catch{}},500);return()=>clearTimeout(t)},[draft]);
 const totals=useMemo(()=>draft.items.reduce((a,x)=>{const s=x.quantity*x.unit_price,d=s*x.discount_percent/100,t=(s-d)*x.tax_rate/100;return{subtotal:a.subtotal+s,discount:a.discount+d,tax:a.tax+t,total:a.total+s-d+t}}, {subtotal:0,discount:0,tax:0,total:0}),[draft.items]);
 const patchItem=(i:number,p:Partial<Item>)=>setDraft(v=>({...v,items:v.items.map((x,n)=>n===i?{...x,...p}:x)}));
 const field=(key:keyof Omit<Draft,"items">,value:string)=>setDraft(v=>({...v,[key]:value}));
 return <form action={async(fd)=>{localStorage.removeItem(draftKey);await action(fd)}} className="card p-5 space-y-5">
  <input type="hidden" name="items" value={JSON.stringify(draft.items)}/>
  {restored&&<div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">กู้คืนร่างล่าสุดจากเครื่องนี้แล้ว</div>}
  <div className="form-grid">
   <label><span className="label">ลูกค้า *</span><select className="input" name="customer_id" required value={draft.customer_id} onChange={e=>field("customer_id",e.target.value)}><option value="">เลือกลูกค้า</option>{customers.map(x=><option key={x.id} value={x.id}>{x.code} - {x.name}</option>)}</select></label>
   <label><span className="label">วันที่ใบเสนอราคา *</span><input className="input" type="date" name="quotation_date" required value={draft.quotation_date} onChange={e=>field("quotation_date",e.target.value)}/></label>
   <label><span className="label">ใช้ได้ถึง</span><input className="input" type="date" name="valid_until" value={draft.valid_until} onChange={e=>field("valid_until",e.target.value)}/></label>
   <label><span className="label">พนักงานขาย</span><input className="input" name="salesperson" value={draft.salesperson} onChange={e=>field("salesperson",e.target.value)} placeholder="ชื่อผู้รับผิดชอบ"/></label>
   <label><span className="label">โครงการ / งาน</span><input className="input" name="project_name" value={draft.project_name} onChange={e=>field("project_name",e.target.value)} placeholder="ชื่อโครงการ (ถ้ามี)"/></label>
   <label><span className="label">สกุลเงิน</span><select className="input" name="currency_code" value={draft.currency_code} onChange={e=>field("currency_code",e.target.value)}><option>THB</option><option>USD</option><option>EUR</option></select></label>
   <label className="full"><span className="label">เงื่อนไขการชำระ</span><input className="input" name="payment_terms" value={draft.payment_terms} onChange={e=>field("payment_terms",e.target.value)}/></label>
  </div>
  <div className="table-wrap"><table className="data-table"><thead><tr><th>สินค้า</th><th>รายละเอียด</th><th>จำนวน</th><th>ราคา</th><th>ส่วนลด %</th><th>VAT %</th><th>รวม</th><th></th></tr></thead><tbody>{draft.items.map((x,i)=>{const s=x.quantity*x.unit_price,d=s*x.discount_percent/100,t=(s-d)*x.tax_rate/100;return <tr key={i}><td><select className="input" value={x.product_id} onChange={e=>{const p=products.find(z=>z.id===e.target.value);patchItem(i,{product_id:e.target.value,description:p?.name||"",unit_price:Number(p?.selling_price||0)})}}><option value="">ไม่ผูกสินค้า</option>{products.map(p=><option key={p.id} value={p.id}>{p.sku} - {p.name}</option>)}</select></td><td><input className="input" value={x.description} onChange={e=>patchItem(i,{description:e.target.value})}/></td><td><input className="input" type="number" min="0.0001" step="0.0001" value={x.quantity} onChange={e=>patchItem(i,{quantity:Number(e.target.value)})}/></td><td><input className="input" type="number" min="0" step="0.01" value={x.unit_price} onChange={e=>patchItem(i,{unit_price:Number(e.target.value)})}/></td><td><input className="input" type="number" min="0" max="100" step="0.01" value={x.discount_percent} onChange={e=>patchItem(i,{discount_percent:Number(e.target.value)})}/></td><td><input className="input" type="number" min="0" step="0.01" value={x.tax_rate} onChange={e=>patchItem(i,{tax_rate:Number(e.target.value)})}/></td><td className="font-bold">฿{(s-d+t).toLocaleString("th-TH",{minimumFractionDigits:2})}</td><td><button type="button" className="btn-secondary btn-small" onClick={()=>setDraft(v=>({...v,items:v.items.filter((_,n)=>n!==i)}))} disabled={draft.items.length===1}>ลบ</button></td></tr>})}</tbody></table></div>
  <button type="button" className="btn-secondary" onClick={()=>setDraft(v=>({...v,items:[...v.items,{...emptyItem}]}))}>+ เพิ่มรายการ</button>
  <div className="grid gap-5 lg:grid-cols-[1fr_360px]"><label><span className="label">หมายเหตุ</span><textarea className="input textarea min-h-36" name="notes" value={draft.notes} onChange={e=>field("notes",e.target.value)}/></label><div className="rounded-2xl bg-slate-50 p-5 space-y-2"><div className="flex justify-between"><span>ยอดก่อนส่วนลด</span><b>฿{totals.subtotal.toLocaleString("th-TH",{minimumFractionDigits:2})}</b></div><div className="flex justify-between"><span>ส่วนลด</span><b>฿{totals.discount.toLocaleString("th-TH",{minimumFractionDigits:2})}</b></div><div className="flex justify-between"><span>ภาษี</span><b>฿{totals.tax.toLocaleString("th-TH",{minimumFractionDigits:2})}</b></div><div className="mt-3 flex justify-between border-t pt-3 text-xl"><span className="font-black">ยอดสุทธิ</span><b>฿{totals.total.toLocaleString("th-TH",{minimumFractionDigits:2})}</b></div></div></div>
  <div className="action-row"><button type="button" className="btn-secondary" onClick={()=>{localStorage.removeItem(draftKey);setDraft({customer_id:"",quotation_date:today,valid_until:"",salesperson:"",project_name:"",payment_terms:"ชำระภายใน 30 วัน",currency_code:"THB",notes:"",items:[{...emptyItem}]});setRestored(false)}}>ล้างร่าง</button><button className="btn-primary">บันทึกใบเสนอราคา</button></div>
 </form>
}
