"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentCompanyId } from "@/lib/current-company";

const text = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();

export async function saveSupplier(fd: FormData) {
  const supabase = await createClient();
  const companyId = await getCurrentCompanyId();
  const id = text(fd, "id");
  const payload = { company_id: companyId, code: text(fd,"code"), name: text(fd,"name"), tax_id: text(fd,"tax_id") || null, phone: text(fd,"phone") || null, email: text(fd,"email") || null, address: text(fd,"address") || null };
  if (!payload.code || !payload.name) throw new Error("กรุณากรอกรหัสและชื่อผู้ขาย");
  const query = id ? supabase.from("suppliers").update(payload).eq("id", id).eq("company_id", companyId) : supabase.from("suppliers").insert(payload);
  const { error } = await query; if (error) throw error;
  revalidatePath("/suppliers");
}

export async function toggleSupplier(fd: FormData) {
  const supabase = await createClient(); const companyId = await getCurrentCompanyId();
  const { error } = await supabase.from("suppliers").update({ is_active: text(fd,"next") === "true" }).eq("id", text(fd,"id")).eq("company_id", companyId);
  if (error) throw error; revalidatePath("/suppliers");
}
