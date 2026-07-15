import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { getPosSales } from "@/lib/services/pos/pos-sale-service";
import { closePosSessionAction, openPosSessionAction } from "./actions";

const money = (value: number | string | null | undefined) => Number(value ?? 0).toLocaleString("th-TH", { minimumFractionDigits: 2 });

export default async function Page() {
  const { sales, sessions, warehouses } = await getPosSales();
  const openSessions = sessions.filter((session) => session.status === "OPEN");
  const total = sales.reduce((sum, sale) => sum + Number(sale.total_amount), 0);
  const cashTotal = sales.filter((sale) => sale.payment_method === "CASH").reduce((sum, sale) => sum + Number(sale.total_amount), 0);
  const openingCash = openSessions.reduce((sum, session) => sum + Number(session.opening_cash), 0);
  const expectedCash = openingCash + cashTotal;

  return (
    <div>
      <PageHeader
        eyebrow="POS"
        title="Point of Sale"
        description="POS sales, sessions, cash drawer, and stock deduction"
        action={<div className="flex gap-2"><Link className="btn-secondary" href="/pos/sales/new">ERP Sale Form</Link><Link className="btn-primary" href="/pos/terminal">Open Terminal</Link></div>}
      />

      <section className="mt-6 grid gap-4 md:grid-cols-4">
        <div className="card p-5"><p className="text-sm text-gray-500">Sales</p><p className="mt-2 text-3xl font-black">{sales.length}</p></div>
        <div className="card p-5"><p className="text-sm text-gray-500">Sales Total</p><p className="mt-2 text-3xl font-black">{money(total)}</p></div>
        <div className="card p-5"><p className="text-sm text-gray-500">Open Sessions</p><p className="mt-2 text-3xl font-black text-emerald-600">{openSessions.length}</p></div>
        <div className="card p-5"><p className="text-sm text-gray-500">Expected Cash</p><p className="mt-2 text-3xl font-black text-orange-700">{money(expectedCash)}</p></div>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="card table-wrap">
          <div className="border-b p-4"><h2 className="font-black">POS Sessions</h2></div>
          <table className="data-table">
            <thead><tr><th>Warehouse</th><th>Opened</th><th>Status</th><th>Opening</th><th>Closing</th><th>Close</th></tr></thead>
            <tbody>
              {sessions.map((session) => (
                <tr key={session.id}>
                  <td className="font-bold">{session.warehouses?.[0]?.name ?? "-"}</td>
                  <td>{new Date(session.opened_at).toLocaleString("th-TH")}</td>
                  <td>{session.status}</td>
                  <td>{money(session.opening_cash)}</td>
                  <td>{session.closing_cash == null ? "-" : money(session.closing_cash)}</td>
                  <td>
                    {session.status === "OPEN" ? (
                      <form action={closePosSessionAction} className="flex flex-wrap gap-2">
                        <input type="hidden" name="session_id" value={session.id} />
                        <input className="input w-32" type="number" min="0" step="0.01" name="closing_cash" defaultValue={expectedCash} />
                        <button className="btn-secondary btn-small">Close</button>
                      </form>
                    ) : (
                      <span className="text-sm text-gray-500">Closed</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!sessions.length && <p className="p-6 text-gray-500">No POS sessions yet.</p>}
        </div>

        <aside className="card p-5">
          <h2 className="font-black">Open Session</h2>
          <form action={openPosSessionAction} className="mt-4 space-y-3">
            <label>
              <span className="label">Warehouse</span>
              <select className="input" name="warehouse_id" required defaultValue={warehouses[0]?.id ?? ""}>
                {warehouses.map((warehouse) => <option key={warehouse.id} value={warehouse.id}>{warehouse.code} - {warehouse.name}</option>)}
              </select>
            </label>
            <label><span className="label">Opening cash</span><input className="input" type="number" min="0" step="0.01" name="opening_cash" defaultValue="0" /></label>
            <label><span className="label">Notes</span><textarea className="input textarea" name="notes" /></label>
            <button className="btn-primary w-full">Open Session</button>
          </form>
        </aside>
      </section>

      <section className="card table-wrap mt-6">
        <table className="data-table">
          <thead><tr><th>No.</th><th>Date</th><th>Customer</th><th>Warehouse</th><th>Payment</th><th>Total</th><th>Paid</th><th>Change</th><th /></tr></thead>
          <tbody>{sales.map((sale) => <tr key={sale.id}><td className="font-bold">{sale.sale_no}</td><td>{sale.sale_date}</td><td>{sale.customers?.[0]?.name ?? "Walk-in"}</td><td>{sale.warehouses?.[0]?.name ?? "-"}</td><td>{sale.payment_method}</td><td>{money(sale.total_amount)}</td><td>{money(sale.paid_amount)}</td><td>{money(sale.change_amount)}</td><td><Link className="btn-secondary btn-small" href={`/pos/sales/${sale.id}`}>Open</Link></td></tr>)}</tbody>
        </table>
        {!sales.length && <p className="p-6 text-gray-500">No POS sales yet.</p>}
      </section>
    </div>
  );
}
