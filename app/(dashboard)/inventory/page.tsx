import Link from "next/link";
import { Boxes, ClipboardList, Layers, Repeat, Ruler, Tags, Warehouse } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { getInventoryDashboard } from "@/lib/services/inventory/stock-service";
import { formatDocumentMoney } from "@/lib/services/documents/document-engine";

const modules = [
  ["/inventory/products", "Products", "Manage SKU, price, barcode, and product master data.", Boxes],
  ["/inventory/categories", "Categories", "Group products for searching and reporting.", Tags],
  ["/inventory/units", "Units", "Manage product counting units.", Ruler],
  ["/inventory/warehouses", "Warehouses", "Manage stock locations by branch.", Warehouse],
  ["/inventory/movements/new", "Stock Movement", "Receive, issue, and adjust stock.", ClipboardList],
  ["/inventory/transfers/new", "Warehouse Transfer", "Move stock between warehouses.", Repeat],
  ["/inventory/stock-card", "Stock Card", "Review product stock movement history.", Layers],
] as const;

const movementLabel: Record<string, string> = {
  RECEIVE: "Receive",
  ISSUE: "Issue",
  ADJUSTMENT_IN: "Adjustment In",
  ADJUSTMENT_OUT: "Adjustment Out",
  TRANSFER_IN: "Transfer In",
  TRANSFER_OUT: "Transfer Out",
};

export default async function InventoryPage() {
  const { balances, movements } = await getInventoryDashboard();
  const totalQuantity = balances.reduce((sum, row) => sum + Number(row.quantity_on_hand || 0), 0);
  const totalCost = balances.reduce((sum, row) => sum + Number(row.total_cost || 0), 0);
  const lowOrEmpty = balances.filter((row) => Number(row.quantity_on_hand || 0) <= 0).length;

  return (
    <div>
      <PageHeader
        eyebrow="INVENTORY"
        title="Inventory"
        description="Manage stock balance, warehouse movements, barcode, lots, serials, and product cost."
      />

      <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="card p-5">
          <p className="text-sm text-gray-500">Balance Rows</p>
          <p className="mt-2 text-3xl font-black">{balances.length}</p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-gray-500">Total Quantity</p>
          <p className="mt-2 text-3xl font-black">{totalQuantity.toLocaleString("th-TH")}</p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-gray-500">Stock Value</p>
          <p className="mt-2 text-3xl font-black text-green-700">THB {formatDocumentMoney(totalCost)}</p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-gray-500">Empty / Zero</p>
          <p className="mt-2 text-3xl font-black text-orange-700">{lowOrEmpty}</p>
        </div>
      </section>

      <section className="module-grid mt-7">
        {modules.map(([href, title, desc, Icon]) => (
          <Link href={href} key={href} className="card module-link p-5">
            <span className="inline-flex rounded-xl bg-orange-50 p-3 text-orange-600">
              <Icon size={22} />
            </span>
            <h2 className="mt-4 font-black">{title}</h2>
            <p className="mt-2 text-sm text-gray-500">{desc}</p>
          </Link>
        ))}
      </section>

      <section className="mt-7 grid gap-6 xl:grid-cols-[1fr_420px]">
        <div className="card table-wrap">
          <div className="border-b p-4">
            <h2 className="font-black">Stock Balance</h2>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Barcode</th>
                <th>Warehouse</th>
                <th>On Hand</th>
                <th>Reserved</th>
                <th>Average Cost</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
              {balances.map((row) => {
                const product = row.products?.[0];
                const warehouse = row.warehouses?.[0];
                return (
                  <tr key={row.id}>
                    <td className="font-bold">{product ? `${product.sku} - ${product.name}` : "-"}</td>
                    <td>{product?.barcode ?? "-"}</td>
                    <td>{warehouse ? `${warehouse.code} - ${warehouse.name}` : "-"}</td>
                    <td>{Number(row.quantity_on_hand).toLocaleString("th-TH")}</td>
                    <td>{Number(row.quantity_reserved).toLocaleString("th-TH")}</td>
                    <td>THB {formatDocumentMoney(row.average_cost)}</td>
                    <td className="font-bold">THB {formatDocumentMoney(row.total_cost)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!balances.length && <p className="p-6 text-gray-500">No stock balance yet. Start by posting stock movement.</p>}
        </div>

        <aside className="card p-5">
          <h2 className="font-black">Latest Movements</h2>
          <div className="mt-4 space-y-3">
            {movements.map((movement) => (
              <div key={movement.id} className="rounded-xl border border-gray-200 p-3">
                <p className="font-bold">{movement.document_no}</p>
                <p className="text-sm text-gray-500">
                  {movement.movement_date} / {movementLabel[movement.movement_type] ?? movement.movement_type}
                </p>
                <p className="mt-1 text-sm">{movement.warehouses?.[0]?.name ?? "-"}</p>
              </div>
            ))}
            {!movements.length && <p className="text-sm text-gray-500">No movement yet.</p>}
          </div>
        </aside>
      </section>
    </div>
  );
}
