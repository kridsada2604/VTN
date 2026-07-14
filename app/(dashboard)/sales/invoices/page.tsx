import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { getInvoiceList } from "@/lib/services/sales/invoice-service";
import { formatDocumentMoney } from "@/lib/services/documents/document-engine";

const statusLabel: Record<string, string> = {
  ISSUED: "ออกเอกสารแล้ว",
  PARTIALLY_PAID: "ชำระบางส่วน",
  PAID: "ชำระแล้ว",
  VOID: "ยกเลิก",
};

export default async function Page() {
  const rows = await getInvoiceList();

  return (
    <div>
      <PageHeader
        eyebrow="SALES"
        title="ใบแจ้งหนี้"
        description="ออกใบแจ้งหนี้ ติดตามยอดค้าง และรับชำระเงิน"
        action={
          <Link href="/sales/invoices/new" className="btn-primary">
            + สร้างใบแจ้งหนี้
          </Link>
        }
      />
      <section className="card table-wrap mt-6">
        <table className="data-table">
          <thead>
            <tr>
              <th>เลขที่</th>
              <th>วันที่</th>
              <th>ลูกค้า</th>
              <th>สถานะ</th>
              <th>ยอดรวม</th>
              <th>ชำระแล้ว</th>
              <th>คงค้าง</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((invoice) => (
              <tr key={invoice.id}>
                <td className="font-bold">{invoice.document_no}</td>
                <td>{invoice.invoice_date}</td>
                <td>{invoice.customers?.[0]?.name ?? "-"}</td>
                <td>
                  <span className="status-badge status-active">{statusLabel[invoice.status] ?? invoice.status}</span>
                </td>
                <td>฿{formatDocumentMoney(invoice.total_amount)}</td>
                <td>฿{formatDocumentMoney(invoice.paid_amount)}</td>
                <td className="font-bold">฿{formatDocumentMoney(invoice.balance_amount)}</td>
                <td>
                  <Link className="btn-secondary btn-small" href={`/sales/invoices/${invoice.id}`}>
                    เปิด
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && <p className="p-6 text-gray-500">ยังไม่มีใบแจ้งหนี้</p>}
      </section>
    </div>
  );
}
