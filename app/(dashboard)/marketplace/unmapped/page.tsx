import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { getUnmappedMarketplaceSkuManagement } from "@/lib/services/marketplace/marketplace-service";
import { mapMarketplaceSkuAction } from "../actions";

export default async function Page() {
  const { unmapped, products } = await getUnmappedMarketplaceSkuManagement();

  return (
    <div>
      <PageHeader
        eyebrow="MARKETPLACE"
        title="Unmapped SKU"
        description="Map marketplace SKUs to products before fulfillment and stock posting."
        action={<Link className="btn-secondary" href="/marketplace">Back to Marketplace</Link>}
      />

      <section className="card table-wrap mt-6">
        <table className="data-table">
          <thead>
            <tr>
              <th>Platform</th>
              <th>Marketplace SKU</th>
              <th>Name</th>
              <th>Orders</th>
              <th>Qty</th>
              <th>Product</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {unmapped.map((item) => (
              <tr key={`${item.channel_id}:${item.marketplace_sku}`}>
                <td>
                  <b>{item.platform}</b>
                  <p className="text-xs text-gray-500">{item.channel_name}</p>
                </td>
                <td className="font-bold">{item.marketplace_sku}</td>
                <td>
                  {item.marketplace_product_name}
                  <p className="text-xs text-gray-500">Latest {item.latest_order_no}</p>
                </td>
                <td>{item.order_count}</td>
                <td>{item.quantity.toLocaleString("th-TH")}</td>
                <td>
                  <form action={mapMarketplaceSkuAction} className="flex min-w-[320px] gap-2">
                    <input type="hidden" name="channel_id" value={item.channel_id} />
                    <input type="hidden" name="marketplace_sku" value={item.marketplace_sku} />
                    <input type="hidden" name="marketplace_product_name" value={item.marketplace_product_name} />
                    <select className="input" name="product_id" required defaultValue="">
                      <option value="">Select product</option>
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.sku} - {product.name}
                        </option>
                      ))}
                    </select>
                    <button className="btn-primary btn-small">Map</button>
                  </form>
                </td>
                <td />
              </tr>
            ))}
          </tbody>
        </table>
        {!unmapped.length && <p className="p-6 text-gray-500">All marketplace SKUs are mapped.</p>}
      </section>
    </div>
  );
}
