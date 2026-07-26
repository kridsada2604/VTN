import Link from "next/link";
import { Building2, KeyRound, MapPin, ShieldCheck, Users, Warehouse } from "lucide-react";
import { PageHeader } from "@/components/page-header";

const modules = [
  ["/company", "Company Profile", Building2],
  ["/branches", "Branches", MapPin],
  ["/users", "Users", Users],
  ["/users/permissions", "Permission Matrix", KeyRound],
  ["/inventory/warehouses", "Warehouses", Warehouse],
  ["/settings", "Security Settings", ShieldCheck],
] as const;

export default function Page() {
  return (
    <div>
      <PageHeader eyebrow="SETTINGS" title="Settings" description="Manage company structure, users, permissions, and security." />
      <section className="module-grid mt-7">
        {modules.map(([href, title, Icon]) => (
          <Link key={href} href={href} className="card module-link p-5">
            <Icon className="text-orange-600" />
            <h2 className="mt-4 font-black">{title}</h2>
            <p className="mt-2 text-sm text-gray-500">Open {title}</p>
          </Link>
        ))}
      </section>
    </div>
  );
}
