import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { FormCard } from "@/components/master-data/form-card";
import { StatusBadge } from "@/components/master-data/status-badge";
import { getProductMaster } from "@/lib/services/inventory/product-service";
import { saveProduct, toggleProduct } from "./actions";

export default async function Page({ searchParams }: { searchParams: Promise<{ q?: string; edit?: string }> }) {
  const { q = "", edit = "" } = await searchParams;
  const { products, categories, units } = await getProductMaster(q);
  const editing = edit ? products.find((product) => product.id === edit) : undefined;

  return (
    <div>
      <PageHeader
        eyebrow="INVENTORY"
        title="Products"
        description="Manage product master data, barcode, categories, units, and prices."
      />

      <div className="two-column-page mt-6">
        <section className="card table-wrap">
          <div className="border-b p-4">
            <form className="search-bar">
              <input className="input" name="q" defaultValue={q} placeholder="Search SKU, barcode, or product name" />
              <button className="btn-secondary">Search</button>
              {q && <Link className="btn-secondary" href="/inventory/products">Clear</Link>}
            </form>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>SKU</th>
                <th>Barcode</th>
                <th>Product</th>
                <th>Category</th>
                <th>Unit</th>
                <th>Cost</th>
                <th>Price</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <td className="font-bold">{product.sku}</td>
                  <td>{product.barcode ?? "-"}</td>
                  <td>{product.name}</td>
                  <td>{product.product_categories?.[0]?.name ?? "-"}</td>
                  <td>{product.units?.[0]?.name ?? "-"}</td>
                  <td>THB {Number(product.cost_price).toLocaleString("th-TH")}</td>
                  <td>THB {Number(product.selling_price).toLocaleString("th-TH")}</td>
                  <td><StatusBadge active={product.is_active} /></td>
                  <td>
                    <div className="action-row">
                      <Link className="btn-secondary btn-small" href={`/inventory/products?edit=${product.id}`}>Edit</Link>
                      <form action={toggleProduct}>
                        <input type="hidden" name="id" value={product.id} />
                        <input type="hidden" name="next" value={String(!product.is_active)} />
                        <button className="btn-secondary btn-small">{product.is_active ? "Disable" : "Enable"}</button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <FormCard title={editing ? "Edit Product" : "New Product"}>
          <form action={saveProduct} className="form-grid">
            <input type="hidden" name="id" value={editing?.id ?? ""} />
            <label>
              <span className="label">SKU *</span>
              <input className="input" name="sku" required defaultValue={editing?.sku} />
            </label>
            <label>
              <span className="label">Barcode</span>
              <input className="input" name="barcode" defaultValue={editing?.barcode ?? ""} />
            </label>
            <label>
              <span className="label">Product name *</span>
              <input className="input" name="name" required defaultValue={editing?.name} />
            </label>
            <label>
              <span className="label">Category</span>
              <select className="input" name="category_id" defaultValue={editing?.category_id ?? ""}>
                <option value="">None</option>
                {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
              </select>
            </label>
            <label>
              <span className="label">Unit</span>
              <select className="input" name="unit_id" defaultValue={editing?.unit_id ?? ""}>
                <option value="">None</option>
                {units.map((unit) => <option key={unit.id} value={unit.id}>{unit.name}</option>)}
              </select>
            </label>
            <label>
              <span className="label">Cost</span>
              <input className="input" type="number" min="0" step="0.01" name="cost_price" defaultValue={editing?.cost_price ?? 0} />
            </label>
            <label>
              <span className="label">Selling price</span>
              <input className="input" type="number" min="0" step="0.01" name="selling_price" defaultValue={editing?.selling_price ?? 0} />
            </label>
            <div className="full action-row">
              <button className="btn-primary">Save Product</button>
              {editing && <Link className="btn-secondary" href="/inventory/products">Cancel</Link>}
            </div>
          </form>
        </FormCard>
      </div>
    </div>
  );
}
