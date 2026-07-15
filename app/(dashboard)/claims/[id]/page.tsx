import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { getClaimDetail } from "@/lib/services/claims/claim-service";
import { createClaimResolutionAction, updateClaimStatusAction } from "../actions";

const statusLabel: Record<string, string> = {
  OPEN: "Open",
  IN_REVIEW: "In review",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
};

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { claim, events, resolutions, products, warehouses } = await getClaimDetail(id);
  if (!claim) notFound();

  return (
    <div>
      <PageHeader eyebrow="CLAIM" title={claim.claim_no} description={`${claim.subject} - ${statusLabel[claim.status] ?? claim.status}`} />
      <div className="my-6"><Link className="btn-secondary" href="/claims">Back</Link></div>

      <section className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <div className="card p-5">
          <dl className="grid gap-4 sm:grid-cols-2">
            <div><dt className="text-sm text-gray-500">Date</dt><dd className="font-bold">{claim.claim_date}</dd></div>
            <div><dt className="text-sm text-gray-500">Type</dt><dd className="font-bold">{claim.claim_type}</dd></div>
            <div><dt className="text-sm text-gray-500">Priority</dt><dd className="font-bold">{claim.priority}</dd></div>
            <div><dt className="text-sm text-gray-500">Status</dt><dd className="font-bold">{statusLabel[claim.status] ?? claim.status}</dd></div>
            <div><dt className="text-sm text-gray-500">Customer</dt><dd className="font-bold">{claim.customers?.[0]?.name ?? "-"}</dd></div>
            <div><dt className="text-sm text-gray-500">Product</dt><dd className="font-bold">{claim.products?.[0]?.name ?? "-"}</dd></div>
          </dl>
          <div className="mt-6 rounded-xl bg-gray-50 p-4"><p className="text-xs font-bold text-gray-500">Description</p><p className="mt-1">{claim.description ?? "-"}</p></div>
          <div className="mt-4 rounded-xl bg-gray-50 p-4"><p className="text-xs font-bold text-gray-500">Resolution</p><p className="mt-1">{claim.resolution ?? "-"}</p></div>
        </div>

        <aside className="space-y-6">
          <section className="card p-5">
            <h2 className="font-black">Resolution Action</h2>
            <form action={createClaimResolutionAction} className="mt-4 space-y-3">
              <input type="hidden" name="claim_id" value={claim.id} />
              <label>
                <span className="label">Action</span>
                <select className="input" name="action_type" defaultValue="REPLACEMENT">
                  <option value="REPLACEMENT">Replacement</option>
                  <option value="REFUND">Refund</option>
                  <option value="CREDIT_NOTE">Credit Note</option>
                </select>
              </label>
              <label>
                <span className="label">Warehouse for replacement</span>
                <select className="input" name="warehouse_id" defaultValue={warehouses[0]?.id ?? ""}>
                  <option value="">No warehouse</option>
                  {warehouses.map((warehouse) => <option key={warehouse.id} value={warehouse.id}>{warehouse.code} - {warehouse.name}</option>)}
                </select>
              </label>
              <label>
                <span className="label">Replacement product</span>
                <select className="input" name="product_id" defaultValue="">
                  <option value="">No product</option>
                  {products.map((product) => <option key={product.id} value={product.id}>{product.sku} - {product.name}</option>)}
                </select>
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label><span className="label">Quantity</span><input className="input" type="number" min="0" step="0.0001" name="quantity" defaultValue="0" /></label>
                <label><span className="label">Refund / Credit amount</span><input className="input" type="number" min="0" step="0.01" name="amount" defaultValue="0" /></label>
              </div>
              <label><span className="label">Notes</span><textarea className="input textarea" name="notes" /></label>
              <button className="btn-primary w-full">Create Resolution</button>
            </form>
          </section>

          <section className="card p-5">
            <h2 className="font-black">Workflow</h2>
            <form action={updateClaimStatusAction} className="mt-4 space-y-3">
              <input type="hidden" name="claim_id" value={claim.id} />
              <label>
                <span className="label">Status</span>
                <select className="input" name="status" defaultValue={claim.status}>
                  {Object.entries(statusLabel).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </label>
              <label><span className="label">Resolution</span><textarea className="input textarea" name="resolution" defaultValue={claim.resolution ?? ""} /></label>
              <button className="btn-primary w-full">Update Claim</button>
            </form>
          </section>

          <section className="card p-5">
            <h2 className="font-black">Resolution History</h2>
            <div className="mt-4 space-y-3">
              {resolutions.map((resolution) => (
                <div key={resolution.id} className="rounded-xl border border-gray-200 p-3">
                  <p className="font-bold">{resolution.action_type}</p>
                  <p className="text-sm text-gray-500">{new Date(resolution.created_at).toLocaleString("th-TH")}</p>
                  <p className="mt-1 text-sm">Product: {resolution.products?.[0]?.name ?? "-"}</p>
                  <p className="text-sm">Qty: {resolution.quantity} / Amount: {resolution.amount}</p>
                  <p className="text-sm">Stock: {resolution.stock_movement_id ? "Posted" : "-"}</p>
                  {resolution.notes && <p className="mt-2 text-sm text-gray-600">{resolution.notes}</p>}
                </div>
              ))}
              {!resolutions.length && <p className="text-sm text-gray-500">No resolution actions yet.</p>}
            </div>
          </section>

          <section className="card p-5">
            <h2 className="font-black">Timeline</h2>
            <div className="mt-5 space-y-4">
              {events.map((event) => (
                <div key={event.id} className="relative border-l-2 border-orange-200 pl-4">
                  <span className="absolute -left-[7px] top-1 h-3 w-3 rounded-full bg-orange-500" />
                  <p className="font-bold">{event.message ?? event.event_type}</p>
                  <p className="text-xs text-gray-500">{new Date(event.created_at).toLocaleString("th-TH")}</p>
                </div>
              ))}
              {!events.length && <p className="text-sm text-gray-500">No timeline events.</p>}
            </div>
          </section>
        </aside>
      </section>
    </div>
  );
}
