"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault(); setError(""); setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      router.replace("/dashboard"); router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "เข้าสู่ระบบไม่สำเร็จ");
    } finally { setLoading(false); }
  }

  return (
    <form onSubmit={submit} className="mt-7 space-y-4">
      <label className="block"><span className="mb-2 block text-sm font-bold">อีเมล</span><input className="input" type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="admin@company.com" /></label>
      <label className="block"><span className="mb-2 block text-sm font-bold">รหัสผ่าน</span><input className="input" type="password" required value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" /></label>
      {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <button className="btn-primary w-full" disabled={loading}>{loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}</button>
    </form>
  );
}
