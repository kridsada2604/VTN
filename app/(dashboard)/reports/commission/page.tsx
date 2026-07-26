import Link from "next/link";
import { Calculator, PlusCircle } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { formatDocumentMoney } from "@/lib/services/documents/document-engine";
import { getCommissionDashboard } from "@/lib/services/reports/commission-service";
import { calculateCommissionRun, saveCommissionRule } from "./actions";

type SearchParams = Record<string, string | string[] | undefined>;

function searchValue(searchParams: SearchParams, key: string) {
  const value = searchParams[key];
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

export default async function Page({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const query = await searchParams;
  const dashboard = await getCommissionDashboard({ from: searchValue(query, "from"), to: searchValue(query, "to") });
  const activeRule = dashboard.preview.activeRule;

  return (
    <div>
      <PageHeader
        eyebrow="REPORT CENTER"
        title="Sale Out Commission"
        description="Calculate salesperson commission from approved dealer Sale Out reports."
        action={<Link className="btn-secondary" href="/reports/SALE_OUT">Back to Sale Out</Link>}
      />

      <section className="mt-6 grid gap-4 md:grid-cols-4">
        <div className="card p-5"><p className="text-sm text-gray-500">Approved Reports</p><p className="mt-2 text-3xl font-black">{dashboard.preview.approvedReportCount}</p></div>
        <div className="card p-5"><p className="text-sm text-gray-500">Commission Base</p><p className="mt-2 text-3xl font-black">THB {formatDocumentMoney(dashboard.preview.baseAmount)}</p></div>
        <div className="card p-5"><p className="text-sm text-gray-500">Estimated Commission</p><p className="mt-2 text-3xl font-black text-orange-700">THB {formatDocumentMoney(dashboard.preview.commissionAmount)}</p></div>
        <div className="card p-5"><p className="text-sm text-gray-500">Active Rule</p><p className="mt-2 font-black">{activeRule ? `${activeRule.name} (${Number(activeRule.rate_percent).toFixed(2)}%)` : "No active rule"}</p></div>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1fr_420px]">
        <div className="space-y-6">
          <section className="card p-5">
            <div className="flex items-center gap-3">
              <Calculator className="text-orange-600" />
              <h2 className="font-black">Preview Commission</h2>
            </div>
            <form className="mt-5 grid gap-4 md:grid-cols-[180px_180px_auto]">
              <label>
                <span className="label">From</span>
                <input className="input" type="date" name="from" defaultValue={dashboard.filters.from} />
              </label>
              <label>
                <span className="label">To</span>
                <input className="input" type="date" name="to" defaultValue={dashboard.filters.to} />
              </label>
              <div className="flex items-end gap-2">
                <button className="btn-primary">Search</button>
                <Link className="btn-secondary" href="/reports/commission">Clear</Link>
              </div>
            </form>
          </section>

          <section className="card table-wrap">
            <div className="border-b p-4"><h2 className="font-black">Commission by Salesperson</h2></div>
            <table className="data-table">
              <thead><tr><th>Salesperson</th><th>Reports</th><th>Base</th><th>Commission</th></tr></thead>
              <tbody>
                {dashboard.preview.lines.map((line) => (
                  <tr key={line.salespersonId}>
                    <td className="font-bold">{line.salespersonName}</td>
                    <td>{line.reportCount}</td>
                    <td>THB {formatDocumentMoney(line.baseAmount)}</td>
                    <td className="font-bold text-orange-700">THB {formatDocumentMoney(line.commissionAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!dashboard.preview.lines.length && <p className="p-6 text-gray-500">No approved Sale Out data matched this period or no active commission rule is available.</p>}
          </section>

          <section className="card table-wrap">
            <div className="border-b p-4"><h2 className="font-black">Recent Commission Runs</h2></div>
            <table className="data-table">
              <thead><tr><th>Rule</th><th>Period</th><th>Status</th><th>Base</th><th>Commission</th><th>Created</th></tr></thead>
              <tbody>
                {dashboard.runs.map((run) => (
                  <tr key={run.id}>
                    <td className="font-bold">{run.sales_commission_rules?.[0]?.name ?? "-"}</td>
                    <td>{run.period_start} - {run.period_end}</td>
                    <td>{run.status}</td>
                    <td>THB {formatDocumentMoney(run.total_base_amount)}</td>
                    <td className="font-bold">THB {formatDocumentMoney(run.total_commission_amount)}</td>
                    <td>{run.created_at}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!dashboard.runs.length && <p className="p-6 text-gray-500">No commission runs have been calculated yet.</p>}
          </section>
        </div>

        <aside className="space-y-6">
          <section className="card p-5">
            <div className="flex items-center gap-3">
              <PlusCircle className="text-orange-600" />
              <h2 className="font-black">Create Rule</h2>
            </div>
            <form action={saveCommissionRule} className="mt-5 space-y-4">
              <label><span className="label">Rule name</span><input className="input" name="name" placeholder="Standard Sale Out 3%" required /></label>
              <label>
                <span className="label">Basis</span>
                <select className="input" name="basis" defaultValue="SALE_OUT_NET">
                  <option value="SALE_OUT_NET">Sale Out Net</option>
                  <option value="SALE_OUT_GROSS">Sale Out Gross</option>
                </select>
              </label>
              <label><span className="label">Rate (%)</span><input className="input" type="number" min="0" max="100" step="0.01" name="rate_percent" defaultValue="3" required /></label>
              <label><span className="label">Minimum base amount</span><input className="input" type="number" min="0" step="0.01" name="minimum_base_amount" defaultValue="0" /></label>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-1">
                <label><span className="label">Effective from</span><input className="input" type="date" name="effective_from" /></label>
                <label><span className="label">Effective to</span><input className="input" type="date" name="effective_to" /></label>
              </div>
              <button className="btn-primary w-full" type="submit">Save Rule</button>
            </form>
          </section>

          <section className="card p-5">
            <h2 className="font-black">Calculate Run</h2>
            <form action={calculateCommissionRun} className="mt-5 space-y-4">
              <label>
                <span className="label">Rule</span>
                <select className="input" name="rule_id" defaultValue={activeRule?.id ?? ""} required>
                  <option value="">Select rule</option>
                  {dashboard.rules.filter((rule) => rule.is_active).map((rule) => (
                    <option key={rule.id} value={rule.id}>{rule.name} - {Number(rule.rate_percent).toFixed(2)}%</option>
                  ))}
                </select>
              </label>
              <label><span className="label">Period start</span><input className="input" type="date" name="period_start" defaultValue={dashboard.filters.from} required /></label>
              <label><span className="label">Period end</span><input className="input" type="date" name="period_end" defaultValue={dashboard.filters.to} required /></label>
              <button className="btn-primary w-full" type="submit" disabled={!dashboard.rules.some((rule) => rule.is_active)}>Calculate Commission</button>
            </form>
          </section>
        </aside>
      </section>
    </div>
  );
}
