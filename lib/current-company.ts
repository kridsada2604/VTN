import { createClient } from "@/lib/supabase/server";

export async function getCurrentCompanyId() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("กรุณาเข้าสู่ระบบ");

  const { data, error } = await supabase
    .from("company_memberships")
    .select("company_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!data?.company_id) throw new Error("ไม่พบบริษัทของผู้ใช้งาน");
  return data.company_id as string;
}
