"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const TEST_ADMIN_ALIAS = "admin";

export function LoginForm() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("Admin");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const normalizedIdentifier = identifier.trim();
      const configuredAdminEmail = process.env.NEXT_PUBLIC_TEST_ADMIN_EMAIL?.trim();
      const email =
        normalizedIdentifier.toLowerCase() === TEST_ADMIN_ALIAS
          ? configuredAdminEmail
          : normalizedIdentifier;

      if (!email) {
        throw new Error(
          "ยังไม่ได้ตั้งค่า NEXT_PUBLIC_TEST_ADMIN_EMAIL ใน Vercel"
        );
      }

      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      router.replace("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "เข้าสู่ระบบไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-7 space-y-4">
      <label className="block">
        <span className="mb-2 block text-sm font-bold">ชื่อผู้ใช้หรืออีเมล</span>
        <input
          className="input"
          type="text"
          required
          value={identifier}
          onChange={(event) => setIdentifier(event.target.value)}
          placeholder="Admin หรือ admin@company.com"
          autoComplete="username"
        />
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-bold">รหัสผ่าน</span>
        <input
          className="input"
          type="password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="1234"
          autoComplete="current-password"
        />
      </label>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
        บัญชีทดสอบ: <strong>Admin</strong> / <strong>1234</strong>
      </div>

      {error && (
        <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>
      )}

      <button className="btn-primary w-full" disabled={loading}>
        {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
      </button>
    </form>
  );
}
