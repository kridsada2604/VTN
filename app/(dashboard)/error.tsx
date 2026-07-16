"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Dashboard route error", error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-2xl flex-col justify-center">
      <section className="card p-6">
        <p className="text-xs font-bold text-orange-600">SYSTEM ERROR</p>
        <h1 className="mt-2 text-2xl font-black">ไม่สามารถโหลดหน้านี้ได้</h1>
        <p className="mt-3 text-sm text-gray-600">
          ระบบบันทึกข้อผิดพลาดไว้แล้ว ลองโหลดใหม่อีกครั้ง หรือกลับไปหน้า Dashboard เพื่อทำงานส่วนอื่นต่อได้
        </p>
        {error.digest && <p className="mt-3 text-xs text-gray-400">Error ID: {error.digest}</p>}
        <div className="mt-5 flex flex-wrap gap-2">
          <button className="btn-primary" onClick={() => reset()}>Try Again</button>
          <Link className="btn-secondary" href="/dashboard">Back to Dashboard</Link>
        </div>
      </section>
    </div>
  );
}
