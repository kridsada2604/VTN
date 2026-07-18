import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { PrintButton } from "@/components/print-button";
import { getCompanyTaxDefaults } from "@/lib/services/core/company-service";
import { getPosSaleDetail } from "@/lib/services/pos/pos-sale-service";
import { refundPosSaleAction, voidPosSaleAction } from "../../actions";

const money = (value: number | string) => Number(value).toLocaleString("th-TH", { minimumFractionDigits: 2 });

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [{ sale, items }, taxDefaults] = await Promise.all([
    getPosSaleDetail(id),
    getCompanyTaxDefaults(),
  ]);
  if (!sale) notFound();
  const showVat = taxDefaults.is_vat_registered;

  const customerName = sale.customers?.[0]?.name ?? "Walk-in";
  const canAdjust = sale.status === "PAID";

  return (
    <div>
      <PageHeader eyebrow="POS RECEIPT" title={sale.sale_no} description={`${sale.sale_date} - ${customerName}`} />
      <div className="mb-4 mt-6 flex flex-wrap gap-2 print:hidden">
        <Link className="btn-secondary" href="/pos">Back to POS</Link>
        <PrintButton label="Print Receipt" />
      </div>

      <section className="card p-5">
        <div className="grid gap-4 md:grid-cols-4">
          <div><p className="label">Warehouse</p><p className="font-bold">{sale.warehouses?.[0]?.name ?? "-"}</p></div>
          <div><p className="label">Payment</p><p className="font-bold">{sale.payment_method}</p></div>
          <div><p className="label">Status</p><p className="font-bold">{sale.status}</p></div>
          <div><p className="label">Change</p><p className="font-bold">{money(sale.change_amount)}</p></div>
        </div>
      </section>

      <section className="card table-wrap mt-6">
        <table className="data-table">
          <thead><tr><th>SKU</th><th>Description</th><th>Qty</th><th>Price</th><th>Discount</th>{showVat && <th>VAT</th>}<th>Total</th></tr></thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>{item.products?.[0]?.sku ?? "-"}</td>
                <td>{item.description}</td>
                <td>{Number(item.quantity).toLocaleString("th-TH")}</td>
                <td>{money(item.unit_price)}</td>
                <td>{money(item.line_discount)}</td>
                {showVat && <td>{money(item.line_tax)}</td>}
                <td className="font-bold">{money(item.line_total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-[1fr_360px]">
        <div className="card p-5"><p className="label">Notes</p><p>{sale.notes ?? "-"}</p></div>
        <div className="card space-y-2 p-5">
          <div className="flex justify-between"><span>Subtotal</span><b>{money(sale.subtotal)}</b></div>
          <div className="flex justify-between"><span>Discount</span><b>{money(sale.discount_amount)}</b></div>
          {showVat && <div className="flex justify-between"><span>VAT</span><b>{money(sale.tax_amount)}</b></div>}
          <div className="mt-3 flex justify-between border-t pt-3 text-xl"><span className="font-black">Total</span><b>{money(sale.total_amount)}</b></div>
          <div className="flex justify-between"><span>Paid</span><b>{money(sale.paid_amount)}</b></div>
        </div>
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-[1fr_1fr] print:hidden">
        <div className="card p-5">
          <h2 className="font-black">Void / Refund</h2>
          {canAdjust ? (
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <form action={voidPosSaleAction} className="space-y-3">
                <input type="hidden" name="sale_id" value={sale.id} />
                <label><span className="label">Void reason</span><textarea className="input textarea" name="reason" placeholder="Wrong bill or cashier cancellation" /></label>
                <button className="btn-secondary w-full">Void Bill</button>
              </form>
              <form action={refundPosSaleAction} className="space-y-3">
                <input type="hidden" name="sale_id" value={sale.id} />
                <label><span className="label">Refund reason</span><textarea className="input textarea" name="reason" placeholder="Returned goods or full customer refund" /></label>
                <button className="btn-primary w-full">Refund Full Bill</button>
              </form>
            </div>
          ) : (
            <p className="mt-3 text-sm text-gray-500">This bill is already {sale.status.toLowerCase()}.</p>
          )}
        </div>

        <div className="card p-5">
          <h2 className="font-black">Adjustment Status</h2>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            <div><dt className="label">Adjusted at</dt><dd className="font-bold">{sale.voided_at ? new Date(sale.voided_at).toLocaleString("th-TH") : "-"}</dd></div>
            <div><dt className="label">Stock reversal</dt><dd className="font-bold">{sale.reversal_stock_movement_id ? "Posted" : "-"}</dd></div>
            <div className="sm:col-span-2"><dt className="label">Reason</dt><dd className="font-bold">{sale.refund_reason ?? "-"}</dd></div>
          </dl>
        </div>
      </section>
    </div>
  );
}
