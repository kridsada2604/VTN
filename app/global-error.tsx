"use client";

import "./globals.css";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  console.error("Global application error", error);

  return (
    <html lang="th">
      <body>
        <main className="min-h-screen bg-gray-50 p-6">
          <div className="mx-auto flex min-h-[80vh] max-w-2xl flex-col justify-center">
            <section className="card p-6">
              <p className="text-xs font-bold text-orange-600">VTN BUSINESS ERP</p>
              <h1 className="mt-2 text-2xl font-black">ระบบมีข้อผิดพลาด</h1>
              <p className="mt-3 text-sm text-gray-600">กรุณาลองใหม่อีกครั้ง หากยังพบปัญหาให้ตรวจสอบ log ของระบบหรือ deployment ล่าสุด</p>
              {error.digest && <p className="mt-3 text-xs text-gray-400">Error ID: {error.digest}</p>}
              <button className="btn-primary mt-5" onClick={() => reset()}>Try Again</button>
            </section>
          </div>
        </main>
      </body>
    </html>
  );
}
