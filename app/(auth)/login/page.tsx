import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <main className="min-h-screen grid lg:grid-cols-2">
      <section className="hidden lg:flex p-12 bg-gradient-to-br from-orange-600 via-orange-500 to-amber-400 text-white flex-col justify-between">
        <div className="font-black text-2xl">VTN Business</div>
        <div>
          <p className="text-sm uppercase tracking-[.3em] opacity-80">
            Business Operating System
          </p>
          <h1 className="mt-4 text-5xl font-black leading-tight">
            ERP และบัญชี
            <br />
            ที่เติบโตไปกับธุรกิจ
          </h1>
          <p className="mt-5 max-w-lg text-lg opacity-90">
            ศูนย์กลางสำหรับยอดขาย สต๊อก การเงิน โครงการ POS และ Marketplace
          </p>
        </div>
        <p className="text-sm opacity-75">VTN Business v0.3.1-alpha</p>
      </section>

      <section className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md card p-7 sm:p-9">
          <div className="lg:hidden mb-7 font-black text-2xl text-orange-600">
            VTN Business
          </div>
          <p className="text-sm font-bold text-orange-600">ยินดีต้อนรับ</p>
          <h2 className="mt-2 text-3xl font-black">เข้าสู่ระบบ</h2>
          <p className="mt-2 text-gray-500">
            ใช้ชื่อ Admin สำหรับบัญชีทดสอบ หรือใช้อีเมล Supabase ตามปกติ
          </p>
          <LoginForm />
        </div>
      </section>
    </main>
  );
}
