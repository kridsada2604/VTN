import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { PrintButton } from "@/components/print-button";
import { getPosSaleDetail } from "@/lib/services/pos/pos-sale-service";

const money = (value: number | string) => Number(value).toLocaleString("th-TH", { minimumFractionDigits: 2 });

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { sale, items } = await getPosSaleDetail(id);
  if (!sale) notFound();

  return (
    <div>
      <PageHeader eyebrow="POS RECEIPT" title={sale.sale_no} description={`${sale.sale_date} · ${sale.customers?.[0]?.name ?? "ลูกค้าทั่วไป"}`} />
      <div className="mb-4 mt-6 flex gap-2"><Link className="btn-secondary" href="/pos">← กลับ POS</Link><PrintButton label="พิมพ์ใบเสร็จ" /></div>
      <section className="card p-5">
        <div className="grid gap-4 md:grid-cols-4">
          <div><p className="label">คลัง</p><p className="font-bold">{sale.warehouses?.[0]?.name ?? "-"}</p></div>
          <div><p className="label">ชำระเงิน</p><p className="font-bold">{sale.payment_method}</p></div>
          <div><p className="label">สถานะ</p><p className="font-bold">{sale.status}</p></div>
          <div><p className="label">เงินทอน</p><p className="font-bold">฿{money(sale.change_amount)}</p></div>
        </div>
      </section>
      <section className="card table-wrap mt-6">
        <table className="data-table">
          <thead><tr><th>สินค้า</th><th>รายละเอียด</th><th>จำนวน</th><th>ราคา</th><th>ส่วนลด</th><th>VAT</th><th>รวม</th></tr></thead>
          <tbody>{items.map((item) => <tr key={item.id}><td>{item.products?.[0]?.sku ?? "-"}</td><td>{item.description}</td><td>{Number(item.quantity).toLocaleString("th-TH")}</td><td>฿{money(item.unit_price)}</td><td>฿{money(item.line_discount)}</td><td>฿{money(item.line_tax)}</td><td className="font-bold">฿{money(item.line_total)}</td></tr>)}</tbody>
        </table>
      </section>
      <section className="mt-6 grid gap-4 md:grid-cols-[1fr_360px]">
        <div className="card p-5"><p className="label">หมายเหตุ</p><p>{sale.notes ?? "-"}</p></div>
        <div className="card space-y-2 p-5">
          <div className="flex justify-between"><span>ยอดก่อนส่วนลด</span><b>฿{money(sale.subtotal)}</b></div>
          <div className="flex justify-between"><span>ส่วนลด</span><b>฿{money(sale.discount_amount)}</b></div>
          <div className="flex justify-between"><span>VAT</span><b>฿{money(sale.tax_amount)}</b></div>
          <div className="mt-3 flex justify-between border-t pt-3 text-xl"><span className="font-black">ยอดสุทธิ</span><b>฿{money(sale.total_amount)}</b></div>
          <div className="flex justify-between"><span>รับเงิน</span><b>฿{money(sale.paid_amount)}</b></div>
        </div>
      </section>
    </div>
  );
}
