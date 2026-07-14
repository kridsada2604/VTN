"use client";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
export function SignOutButton(){const router=useRouter();return <button className="w-full flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-slate-300 hover:bg-white/10" onClick={async()=>{await createClient().auth.signOut();router.replace('/login');router.refresh();}}><LogOut size={18}/>ออกจากระบบ</button>}
