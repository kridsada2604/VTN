import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { getClaims } from "@/lib/services/claims/claim-service";

const statusLabel: Record<string, string> = {
  OPEN: "Open",
  IN_REVIEW: "In Review",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
};

export default async function Page() {
  const claims = await getClaims();

  return (
    <div>
      <PageHeader
        eyebrow="CLAIMS"
        title="Claim"
        description="Manage product claims, warranty service, returns, and refunds."
        action={
          <div className="flex flex-wrap gap-2">
            <Link className="btn-secondary" href="/claims/warranty">Warranty</Link>
            <Link className="btn-primary" href="/claims/new">+ New Claim</Link>
          </div>
        }
      />
      <section className="card table-wrap mt-6">
        <table className="data-table">
          <thead>
            <tr>
              <th>No.</th>
              <th>Date</th>
              <th>Customer</th>
              <th>Product</th>
              <th>Type</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Subject</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {claims.map((claim) => (
              <tr key={claim.id}>
                <td className="font-bold">{claim.claim_no}</td>
                <td>{claim.claim_date}</td>
                <td>{claim.customers?.[0]?.name ?? "-"}</td>
                <td>{claim.products?.[0]?.name ?? "-"}</td>
                <td>{claim.claim_type}</td>
                <td>{claim.priority}</td>
                <td>{statusLabel[claim.status] ?? claim.status}</td>
                <td>{claim.subject}</td>
                <td><Link className="btn-secondary btn-small" href={`/claims/${claim.id}`}>Open</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
        {!claims.length && <p className="p-6 text-gray-500">No claims yet.</p>}
      </section>
    </div>
  );
}
