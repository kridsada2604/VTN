import Link from "next/link";
import { Building2, LayoutDashboard, MapPin, Settings, Users, Boxes, ShoppingCart, ReceiptText } from "lucide-react";
import { SignOutButton } from "./sign-out-button";

const nav = [
  ["/dashboard", "แดชบอร์ด", LayoutDashboard],
  ["/company", "บริษัท", Building2],
  ["/branches", "สาขา", MapPin],
  ["/users", "ผู้ใช้งาน", Users],
  ["#", "สินค้าและสต๊อก", Boxes],
  ["#", "การขาย", ShoppingCart],
  ["#", "บัญชี", ReceiptText],
  ["#", "ตั้งค่า", Settings],
] as const;

export function AppShell({ children, email }: { children: React.ReactNode; email?: string }) {
  return <div className="min-h-screen lg:grid lg:grid-cols-[260px_1fr]">
    <aside className="hidden lg:flex bg-slate-900 text-white p-5 flex-col">
      <div className="px-3 py-4 text-xl font-black"><span className="text-orange-500">VTN</span> Business</div>
      <nav className="mt-5 space-y-1 flex-1">{nav.map(([href,label,Icon])=><Link key={label} href={href} className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-300 hover:bg-white/10 hover:text-white"><Icon size={18}/>{label}</Link>)}</nav>
      <div className="border-t border-white/10 pt-4"><p className="px-3 mb-3 truncate text-xs text-slate-400">{email}</p><SignOutButton/></div>
    </aside>
    <div>
      <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-white/90 px-5 backdrop-blur sm:px-8"><div><p className="text-xs font-bold text-orange-600">VTN BUSINESS</p><p className="font-bold">ระบบบริหารธุรกิจ</p></div><div className="rounded-full bg-orange-100 px-3 py-1.5 text-xs font-bold text-orange-700">Phase 1</div></header>
      <main className="p-5 sm:p-8">{children}</main>
    </div>
  </div>;
}
