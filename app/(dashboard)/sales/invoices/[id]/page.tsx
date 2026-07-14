import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { PrintButton } from "@/components/sales/print-button";
import { createInvoiceEmailDraft, formatDocumentMoney } from "@/lib/services/documents/document-engine";
import { getInvoiceDetail } from "@/lib/services/sales/invoice-service";
import { receivePayment } from "../actions";

const statusLabel: Record<string, string> = {
  ISSUED: "ออกเอกสารแล้ว",
  PARTIALLY_PAID: "ชำระบางส่วน",
  PAID: "ชำระแล้ว",
  VOID: "ยกเลิก",
};

const paymentMethodLabel: Record<string, string> = {
  CASH: "เงินสด",
  BANK_TRANSFER: "โอนเงิน",
  CHEQUE: "เช็ค",
  CREDIT_CARD: "บัตรเครดิต",
  OTHER: "อื่น ๆ",
};

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { invoice, items, payments, events } = await getInvoiceDetail(id);
  if (!invoice) notFound();

  const customer = invoice.customers?.[0];
  const balanceAmount = Number(invoice.balance_amount);
  const emailLink = createInvoiceEmailDraft({
    documentNo: invoice.document_no,
    customerName: customer?.name ?? "-",
    customerEmail: customer?.email ?? null,
    totalAmount: Number(invoice.total_amount),
    balanceAmount,
  });

  return (
    <div className="print:bg-white">
      <PageHeader
        eyebrow="INVOICE"
        title={invoice.document_no}
        description={`${customer?.name ?? ""} • ${invoice.invoice_date}`}
      />
      <div className="action-row my-6 print:hidden">
        <Link className="btn-secondary" href="/sales/invoices">
          ← กลับรายการ
        </Link>
        <PrintButton />
        <a className="btn-secondary" href={emailLink}>
          ส่งอีเมล
        </a>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <section className="card p-5 print:border-0 print:shadow-none">
          <div className="mb-7 flex items-start justify-between gap-4">
            <div>
              <p className="text-2xl font-black">
                <span className="text-orange-600">VTN</span> Business
              </p>
              <p className="text-sm text-gray-500">ใบแจ้งหนี้ / Invoice</p>
            </div>
            <div className="text-right">
              <p className="text-xl font-black">{invoice.document_no}</p>
              <p className="text-sm text-gray-500">สถานะ: {statusLabel[invoice.status] ?? invoice.status}</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-sm text-gray-500">ลูกค้า</p>
              <p className="font-bold">{customer?.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">เลขผู้เสียภาษี</p>
              <p className="font-bold">{customer?.tax_id ?? "-"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">วันที่</p>
              <p className="font-bold">{invoice.invoice_date}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">ครบกำหนด</p>
              <p className="font-bold">{invoice.due_date ?? "-"}</p>
            </div>
            <div className="sm:col-span-2">
              <p className="text-sm text-gray-500">ที่อยู่</p>
              <p className="font-bold">{customer?.address ?? "-"}</p>
            </div>
            <div className="sm:col-span-2">
              <p className="text-sm text-gray-500">เงื่อนไขชำระ</p>
              <p className="font-bold">{invoice.payment_terms ?? "-"}</p>
            </div>
          </div>

          <div className="table-wrap mt-6">
            <table className="data-table">
              <thead>
                <tr>
                  <th>รายละเอียด</th>
                  <th>จำนวน</th>
                  <th>ราคา</th>
                  <th>ส่วนลด</th>
                  <th>ภาษี</th>
                  <th>รวม</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.description}</td>
                    <td>{item.quantity}</td>
                    <td>{formatDocumentMoney(item.unit_price)}</td>
                    <td>{formatDocumentMoney(item.line_discount)}</td>
                    <td>{formatDocumentMoney(item.line_tax)}</td>
                    <td className="font-bold">{formatDocumentMoney(item.line_total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="ml-auto mt-6 max-w-sm space-y-2 text-right">
            <p>ยอดก่อนลด: ฿{formatDocumentMoney(invoice.subtotal)}</p>
            <p>ส่วนลด: ฿{formatDocumentMoney(invoice.discount_amount)}</p>
            <p>ภาษี: ฿{formatDocumentMoney(invoice.tax_amount)}</p>
            <p className="text-2xl font-black">รวม ฿{formatDocumentMoney(invoice.total_amount)}</p>
            <p className="font-bold text-green-700">ชำระแล้ว ฿{formatDocumentMoney(invoice.paid_amount)}</p>
            <p className="font-bold text-orange-700">คงค้าง ฿{formatDocumentMoney(invoice.balance_amount)}</p>
          </div>
          {invoice.notes && (
            <div className="mt-6 rounded-xl bg-gray-50 p-4">
              <p className="text-xs font-bold text-gray-500">หมายเหตุ</p>
              <p className="mt-1">{invoice.notes}</p>
            </div>
          )}
        </section>

        <aside className="space-y-6 print:hidden">
          <section className="card p-5">
            <h2 className="font-black">รับชำระเงิน</h2>
            {balanceAmount <= 0 ? (
              <p className="mt-4 text-sm text-green-700">ใบแจ้งหนี้นี้ชำระครบแล้ว</p>
            ) : (
              <form action={receivePayment} className="mt-4 space-y-3">
                <input type="hidden" name="invoice_id" value={invoice.id} />
                <label>
                  <span className="label">วันที่รับชำระ</span>
                  <input className="input" type="date" name="payment_date" required defaultValue={new Date().toISOString().slice(0, 10)} />
                </label>
                <label>
                  <span className="label">วิธีรับชำระ</span>
                  <select className="input" name="method" required defaultValue="BANK_TRANSFER">
                    {Object.entries(paymentMethodLabel).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span className="label">ยอดรับชำระ</span>
                  <input className="input" type="number" min="0.01" max={balanceAmount} step="0.01" name="amount" required defaultValue={balanceAmount} />
                </label>
                <label>
                  <span className="label">เลขอ้างอิง</span>
                  <input className="input" name="reference_no" />
                </label>
                <label>
                  <span className="label">หมายเหตุ</span>
                  <textarea className="input textarea" name="notes" />
                </label>
                <button className="btn-primary w-full">บันทึกรับชำระ</button>
              </form>
            )}
          </section>

          <section className="card p-5">
            <h2 className="font-black">ประวัติรับชำระ</h2>
            <div className="mt-4 space-y-3">
              {payments.map((payment) => (
                <div key={payment.id} className="rounded-xl border border-gray-200 p-3">
                  <p className="font-bold">{payment.payment_no}</p>
                  <p className="text-sm text-gray-500">
                    {payment.payment_date} • {paymentMethodLabel[payment.method] ?? payment.method}
                  </p>
                  <p className="mt-1 font-black">฿{formatDocumentMoney(payment.amount)}</p>
                </div>
              ))}
              {!payments.length && <p className="text-sm text-gray-500">ยังไม่มีการรับชำระ</p>}
            </div>
          </section>

          <section className="card p-5">
            <h2 className="font-black">Timeline เอกสาร</h2>
            <div className="mt-5 space-y-5">
              {events.map((event) => (
                <div key={event.id} className="relative border-l-2 border-orange-200 pl-4">
                  <span className="absolute -left-[7px] top-1 h-3 w-3 rounded-full bg-orange-500" />
                  <p className="font-bold">{event.message ?? event.event_type}</p>
                  <p className="mt-1 text-xs text-gray-500">{new Date(event.created_at).toLocaleString("th-TH")}</p>
                </div>
              ))}
              {!events.length && <p className="text-sm text-gray-500">ยังไม่มีประวัติ</p>}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
