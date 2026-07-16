import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { getWarrantyPolicies } from "@/lib/services/claims/claim-service";
import { saveWarrantyPolicy } from "../actions";

export default async function Page() {
  const { policies, products } = await getWarrantyPolicies();

  return (
    <div>
      <PageHeader
        eyebrow="CLAIMS"
        title="Warranty Policy"
        description="Warranty rules for claim review and customer service."
        action={<Link className="btn-secondary" href="/claims">Back to Claims</Link>}
      />

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_380px]">
        <section className="card table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Policy</th>
                <th>Product</th>
                <th>Duration</th>
                <th>Coverage</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {policies.map((policy) => (
                <tr key={policy.id}>
                  <td className="font-bold">{policy.policy_name}</td>
                  <td>{policy.products?.[0] ? `${policy.products[0].sku} - ${policy.products[0].name}` : "General"}</td>
                  <td>{policy.duration_days} days</td>
                  <td>{policy.coverage ?? "-"}</td>
                  <td>{policy.is_active ? "Active" : "Inactive"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!policies.length && <p className="p-6 text-gray-500">No warranty policies yet.</p>}
        </section>

        <aside className="card p-5">
          <h2 className="font-black">New Warranty Policy</h2>
          <form action={saveWarrantyPolicy} className="mt-4 space-y-3">
            <label>
              <span className="label">Product</span>
              <select className="input" name="product_id" defaultValue="">
                <option value="">General policy</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.sku} - {product.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span className="label">Policy name</span>
              <input className="input" name="policy_name" required placeholder="Standard warranty" />
            </label>

            <label>
              <span className="label">Duration days</span>
              <input className="input" type="number" min="0" step="1" name="duration_days" defaultValue="365" />
            </label>

            <label>
              <span className="label">Coverage</span>
              <textarea className="input textarea" name="coverage" placeholder="Parts, labor, exclusions, customer requirements" />
            </label>

            <button className="btn-primary w-full">Save Policy</button>
          </form>
        </aside>
      </div>
    </div>
  );
}
