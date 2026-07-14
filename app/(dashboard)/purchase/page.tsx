import Link from "next/link";
import { ClipboardList, PackageCheck, Receipt, Truck } from "lucide-react";
import { PageHeader } from "@/components/page-header";

const modules = [
  ["/suppliers", "Supplier", "ฐานข้อมูลผู้ขายและผู้ให้บริการ", Truck, true],
  ["/purchase/orders", "Purchase Order", "สร้างและติดตามใบสั่งซื้อ", ClipboardList, true],
  ["#", "Receive", "รับสินค้าเข้าคลังและสร้าง stock movement", PackageCheck, false],
  ["#", "Payment", "บันทึกจ่ายชำระ Supplier", Receipt, false],
] as const;

export default function Page() {
  return (
    <div>
      <PageHeader eyebrow="PURCHASE" title="จัดซื้อ" description="จัดการ Supplier, PO, รับของ และจ่ายชำระ" />
      <section className="module-grid mt-7">
        {modules.map(([href, title, desc, Icon, ready]) => (
          <Link href={href} key={title} className="card module-link p-5">
            <Icon className="text-orange-600" />
            <h2 className="mt-4 font-black">{title}</h2>
            <p className="mt-2 text-sm text-gray-500">{desc}</p>
            <span className={`mt-4 inline-block rounded-full px-3 py-1 text-xs font-bold ${ready ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}`}>
              {ready ? "ใช้งานได้" : "กำลังพัฒนา"}
            </span>
          </Link>
        ))}
      </section>
    </div>
  );
}
