import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { PrintButton } from "@/components/sales/print-button";
import { getCompanyTaxDefaults } from "@/lib/services/core/company-service";
import { getQuotationDetail } from "@/lib/services/sales/quotation-service";
import { convertQuotationToSalesOrder, updateQuotationStatus } from "../actions";

const statusLabel: Record<string, string> = {
  DRAFT: "ร่าง",
  SENT: "ส่งแล้ว",
  ACCEPTED: "อนุมัติ",
  REJECTED: "ปฏิเสธ",
  CANCELLED: "ยกเลิก",
};

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [{ quotation, items, events }, taxDefaults] = await Promise.all([
    getQuotationDetail(id),
    getCompanyTaxDefaults(),
  ]);
  if (!quotation) notFound();
  const showVat = taxDefaults.is_vat_registered;

  return (
    <div className="print:bg-white">
      <PageHeader eyebrow="QUOTATION" title={quotation.document_no} description={`${quotation.customers?.[0]?.name ?? ""} - ${quotation.quotation_date}`} />
      <div className="action-row my-6 print:hidden">
        <Link className="btn-secondary" href="/sales/quotations">← กลับรายการ</Link>
        <PrintButton />
        {Object.keys(statusLabel).map((status) => (
          <form action={updateQuotationStatus} key={status}>
            <input type="hidden" name="id" value={id} />
            <input type="hidden" name="status" value={status} />
            <button className={quotation.status === status ? "btn-primary" : "btn-secondary"}>{statusLabel[status]}</button>
          </form>
        ))}
        {quotation.status === "ACCEPTED" && (
          <form action={convertQuotationToSalesOrder} className="flex gap-2">
            <input type="hidden" name="quotation_id" value={id} />
            <input className="input" type="date" name="order_date" defaultValue={new Date().toISOString().slice(0, 10)} required />
            <button className="btn-primary">Create SO</button>
          </form>
        )}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <section className="card p-5 print:border-0 print:shadow-none">
          <div className="mb-7 flex items-start justify-between gap-4">
            <div><p className="text-2xl font-black"><span className="text-orange-600">VTN</span> Business</p><p className="text-sm text-gray-500">ใบเสนอราคา / Quotation</p></div>
            <div className="text-right"><p className="text-xl font-black">{quotation.document_no}</p><p className="text-sm text-gray-500">สถานะ: {statusLabel[quotation.status] ?? quotation.status}</p></div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div><p className="text-sm text-gray-500">ลูกค้า</p><p className="font-bold">{quotation.customers?.[0]?.name}</p></div>
            <div><p className="text-sm text-gray-500">วันที่</p><p className="font-bold">{quotation.quotation_date}</p></div>
            <div><p className="text-sm text-gray-500">ใช้ได้ถึง</p><p className="font-bold">{quotation.valid_until ?? "-"}</p></div>
            <div><p className="text-sm text-gray-500">สกุลเงิน</p><p className="font-bold">{quotation.currency_code ?? "THB"}</p></div>
            <div><p className="text-sm text-gray-500">พนักงานขาย</p><p className="font-bold">{quotation.salesperson ?? "-"}</p></div>
            <div><p className="text-sm text-gray-500">โครงการ</p><p className="font-bold">{quotation.project_name ?? "-"}</p></div>
            <div className="sm:col-span-2"><p className="text-sm text-gray-500">เงื่อนไขชำระ</p><p className="font-bold">{quotation.payment_terms ?? "-"}</p></div>
          </div>

          <div className="table-wrap mt-6">
            <table className="data-table">
              <thead><tr><th>รายละเอียด</th><th>จำนวน</th><th>ราคา</th><th>ส่วนลด</th>{showVat && <th>ภาษี</th>}<th>รวม</th></tr></thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.description}</td>
                    <td>{item.quantity}</td>
                    <td>{Number(item.unit_price).toLocaleString()}</td>
                    <td>{Number(item.line_discount).toLocaleString()}</td>
                    {showVat && <td>{Number(item.line_tax).toLocaleString()}</td>}
                    <td className="font-bold">{Number(item.line_total).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="ml-auto mt-6 max-w-sm space-y-2 text-right">
            <p>ยอดก่อนลด: ฿{Number(quotation.subtotal).toLocaleString("th-TH", { minimumFractionDigits: 2 })}</p>
            <p>ส่วนลด: ฿{Number(quotation.discount_amount).toLocaleString("th-TH", { minimumFractionDigits: 2 })}</p>
            {showVat && <p>ภาษี: ฿{Number(quotation.tax_amount).toLocaleString("th-TH", { minimumFractionDigits: 2 })}</p>}
            <p className="text-2xl font-black">รวม ฿{Number(quotation.total_amount).toLocaleString("th-TH", { minimumFractionDigits: 2 })}</p>
          </div>
          {quotation.notes && <div className="mt-6 rounded-xl bg-gray-50 p-4"><p className="text-xs font-bold text-gray-500">หมายเหตุ</p><p className="mt-1">{quotation.notes}</p></div>}
        </section>

        <aside className="card p-5 print:hidden">
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
        </aside>
      </div>
    </div>
  );
}
