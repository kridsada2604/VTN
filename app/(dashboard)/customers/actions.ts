"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentCompanyId } from "@/lib/current-company";

const text = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();

export async function saveCustomer(fd: FormData) {
  const supabase = await createClient();
  const companyId = await getCurrentCompanyId();
  const id = text(fd, "id");
  const payload = { company_id: companyId, code: text(fd,"code"), name: text(fd,"name"), tax_id: text(fd,"tax_id") || null, phone: text(fd,"phone") || null, email: text(fd,"email") || null, address: text(fd,"address") || null };
  if (!payload.code || !payload.name) throw new Error("กรุณากรอกรหัสและชื่อลูกค้า");
  const query = id ? supabase.from("customers").update(payload).eq("id", id).eq("company_id", companyId) : supabase.from("customers").insert(payload);
  const { error } = await query; if (error) throw error;
  revalidatePath("/customers");
}

export async function toggleCustomer(fd: FormData) {
  const supabase = await createClient(); const companyId = await getCurrentCompanyId();
  const { error } = await supabase.from("customers").update({ is_active: text(fd,"next") === "true" }).eq("id", text(fd,"id")).eq("company_id", companyId);
  if (error) throw error; revalidatePath("/customers");
}
