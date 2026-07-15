import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { getClaimDetail } from "@/lib/services/claims/claim-service";
import { updateClaimStatusAction } from "../actions";

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
  const { claim, events } = await getClaimDetail(id);
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
