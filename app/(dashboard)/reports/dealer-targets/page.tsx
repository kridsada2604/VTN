import Link from "next/link";
import { Target } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { formatDocumentMoney } from "@/lib/services/documents/document-engine";
import { getDealerTargetDashboard } from "@/lib/services/reports/dealer-target-service";
import { saveDealerTarget } from "./actions";

type SearchParams = Record<string, string | string[] | undefined>;

function searchValue(searchParams: SearchParams, key: string) {
  const value = searchParams[key];
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

function achievementClass(value: number) {
  if (value >= 100) return "text-green-700";
  if (value >= 80) return "text-amber-700";
  return "text-red-700";
}

export default async function Page({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const query = await searchParams;
  const dashboard = await getDealerTargetDashboard({ from: searchValue(query, "from"), to: searchValue(query, "to") });

  return (
    <div>
      <PageHeader
        eyebrow="REPORT CENTER"
        title="Dealer Target vs Actual"
        description="Compare dealer targets with approved Sale Out actual sales."
        action={<Link className="btn-secondary" href="/reports/SALE_OUT">Back to Sale Out</Link>}
      />

      <section className="mt-6 grid gap-4 md:grid-cols-4">
        <div className="card p-5"><p className="text-sm text-gray-500">Dealers With Target</p><p className="mt-2 text-3xl font-black">{dashboard.summary.dealerCount}</p></div>
        <div className="card p-5"><p className="text-sm text-gray-500">Target</p><p className="mt-2 text-3xl font-black">THB {formatDocumentMoney(dashboard.summary.targetAmount)}</p></div>
        <div className="card p-5"><p className="text-sm text-gray-500">Approved Actual</p><p className="mt-2 text-3xl font-black text-orange-700">THB {formatDocumentMoney(dashboard.summary.actualAmount)}</p></div>
        <div className="card p-5"><p className="text-sm text-gray-500">Achievement</p><p className={`mt-2 text-3xl font-black ${achievementClass(dashboard.summary.achievementPercent)}`}>{dashboard.summary.achievementPercent.toFixed(2)}%</p></div>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1fr_420px]">
        <div className="space-y-6">
          <section className="card p-5">
            <div className="flex items-center gap-3">
              <Target className="text-orange-600" />
              <h2 className="font-black">Analysis Period</h2>
            </div>
            <form className="mt-5 grid gap-4 md:grid-cols-[180px_180px_auto]">
              <label><span className="label">From</span><input className="input" type="date" name="from" defaultValue={dashboard.filters.from} /></label>
              <label><span className="label">To</span><input className="input" type="date" name="to" defaultValue={dashboard.filters.to} /></label>
              <div className="flex items-end gap-2">
                <button className="btn-primary">Search</button>
                <Link className="btn-secondary" href="/reports/dealer-targets">Clear</Link>
              </div>
            </form>
          </section>

          <section className="card table-wrap">
            <div className="border-b p-4"><h2 className="font-black">Target vs Actual</h2></div>
            <table className="data-table">
              <thead><tr><th>Dealer</th><th>Target</th><th>Actual</th><th>Variance</th><th>Achievement</th><th>Notes</th></tr></thead>
              <tbody>
                {dashboard.lines.map((line) => (
                  <tr key={`${line.dealerId}-${line.targetAmount}`}>
                    <td><b>{line.dealerName}</b><p className="text-xs text-gray-500">{line.dealerCode}</p></td>
                    <td>THB {formatDocumentMoney(line.targetAmount)}</td>
                    <td className="font-bold">THB {formatDocumentMoney(line.actualAmount)}</td>
                    <td className={line.varianceAmount >= 0 ? "font-bold text-green-700" : "font-bold text-red-700"}>THB {formatDocumentMoney(line.varianceAmount)}</td>
                    <td className={`font-bold ${achievementClass(line.achievementPercent)}`}>{line.achievementPercent.toFixed(2)}%</td>
                    <td>{line.notes ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!dashboard.lines.length && <p className="p-6 text-gray-500">No dealer targets found for this period.</p>}
          </section>
        </div>

        <aside className="card p-5">
          <h2 className="font-black">Set Dealer Target</h2>
          <form action={saveDealerTarget} className="mt-5 space-y-4">
            <label>
              <span className="label">Dealer</span>
              <select className="input" name="dealer_id" required>
                <option value="">Select dealer</option>
                {dashboard.dealers.map((dealer) => <option key={dealer.id} value={dealer.id}>{dealer.code} - {dealer.name}</option>)}
              </select>
            </label>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-1">
              <label><span className="label">Period start</span><input className="input" type="date" name="period_start" defaultValue={dashboard.filters.from} required /></label>
              <label><span className="label">Period end</span><input className="input" type="date" name="period_end" defaultValue={dashboard.filters.to} required /></label>
            </div>
            <label><span className="label">Target amount</span><input className="input" type="number" min="0" step="0.01" name="target_amount" required /></label>
            <label><span className="label">Notes</span><textarea className="input min-h-24" name="notes" /></label>
            <button className="btn-primary w-full" type="submit">Save Target</button>
          </form>
        </aside>
      </section>
    </div>
  );
}
