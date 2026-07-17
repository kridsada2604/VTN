import Link from "next/link";
import { BarChart3, CircleDollarSign, CreditCard, FileText, Receipt, ShoppingBag, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { getInvoiceList } from "@/lib/services/sales/invoice-service";
import { formatDocumentMoney } from "@/lib/services/documents/document-engine";

const modules = [
  ["/sales/quotations", "ใบเสนอราคา", "สร้างและติดตามใบเสนอราคา", FileText, true],
  ["/sales/orders", "ใบสั่งขาย", "รับคำสั่งซื้อ จองสต๊อก และส่งของ", ShoppingBag, true],
  ["/sales/invoices", "ใบแจ้งหนี้", "ออกเอกสาร PDF และติดตามยอดค้าง", Receipt, true],
  ["/sales/invoices", "รับชำระเงิน", "บันทึกเงินสด โอน เช็ค และบัตรเครดิต", CreditCard, true],
  ["/sales/sale-out", "Sale Out", "Dealer reported sales for real demand, growth, and future commission", BarChart3, true],
] as const;

export default async function Page() {
  const invoices = await getInvoiceList();
  const total = invoices.reduce((sum, invoice) => sum + Number(invoice.total_amount || 0), 0);
  const paid = invoices.reduce((sum, invoice) => sum + Number(invoice.paid_amount || 0), 0);
  const outstanding = invoices.reduce((sum, invoice) => sum + Number(invoice.balance_amount || 0), 0);
  const openInvoices = invoices.filter((invoice) => Number(invoice.balance_amount || 0) > 0).length;

  return (
    <div>
      <PageHeader eyebrow="SALES" title="การขาย" description="ภาพรวมงานขาย เอกสาร และการรับชำระเงิน" />
      <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="card p-5">
          <p className="text-sm text-gray-500">ใบแจ้งหนี้ทั้งหมด</p>
          <p className="mt-2 text-3xl font-black">{invoices.length}</p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-gray-500">มูลค่ารวม</p>
          <p className="mt-2 text-3xl font-black">฿{formatDocumentMoney(total)}</p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-gray-500">รับชำระแล้ว</p>
          <p className="mt-2 text-3xl font-black text-green-700">฿{formatDocumentMoney(paid)}</p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-gray-500">คงค้าง</p>
          <p className="mt-2 text-3xl font-black text-orange-700">฿{formatDocumentMoney(outstanding)}</p>
          <p className="mt-1 text-xs text-gray-500">{openInvoices} เอกสารยังเปิดอยู่</p>
        </div>
      </section>

      <section className="module-grid mt-7">
        {modules.map(([href, title, description, Icon, ready]) => (
          <Link key={title} href={href} className="card module-link p-5">
            <Icon className="text-orange-600" />
            <h2 className="mt-4 font-black">{title}</h2>
            <p className="mt-2 text-sm text-gray-500">{description}</p>
            <span className={`mt-4 inline-block rounded-full px-3 py-1 text-xs font-bold ${ready ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}`}>
              {ready ? "ใช้งานได้" : "กำลังพัฒนา"}
            </span>
          </Link>
        ))}
      </section>

      <section className="mt-7 grid gap-4 lg:grid-cols-2">
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <TrendingUp className="text-orange-600" />
            <h2 className="font-black">ขั้นตอนการขาย</h2>
          </div>
          <p className="mt-3 text-sm text-gray-500">Lead → Customer → Quotation → Sales Order → Delivery → Invoice → Receive Payment → Accounting</p>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <CircleDollarSign className="text-orange-600" />
            <h2 className="font-black">บัญชีอัตโนมัติ</h2>
          </div>
          <p className="mt-3 text-sm text-gray-500">Sprint 7 เตรียม audit log และ payment event เพื่อส่งต่อ Accounting ใน Sprint 9</p>
        </div>
      </section>
    </div>
  );
}
