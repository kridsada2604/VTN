"use client";

import { useMemo, useState } from "react";

type Warehouse = { id: string; code: string; name: string };
type Product = { id: string; sku: string; name: string; cost_price: number; barcode: string | null };
type Item = {
  product_id: string;
  quantity: number;
  unit_cost: number;
  lot_no: string;
  serial_no: string;
  barcode: string;
};

const emptyItem: Item = {
  product_id: "",
  quantity: 1,
  unit_cost: 0,
  lot_no: "",
  serial_no: "",
  barcode: "",
};

export function StockTransferForm({
  warehouses,
  products,
  action,
}: {
  warehouses: Warehouse[];
  products: Product[];
  action: (fd: FormData) => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [items, setItems] = useState<Item[]>([{ ...emptyItem }]);
  const totalQuantity = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items]);

  const patchItem = (index: number, patch: Partial<Item>) => {
    setItems((current) => current.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)));
  };

  return (
    <form action={action} className="card space-y-5 p-5">
      <input type="hidden" name="items" value={JSON.stringify(items)} />

      <div className="form-grid">
        <label>
          <span className="label">From warehouse *</span>
          <select className="input" name="from_warehouse_id" required defaultValue={warehouses[0]?.id ?? ""}>
            {warehouses.map((warehouse) => (
              <option key={warehouse.id} value={warehouse.id}>{warehouse.code} - {warehouse.name}</option>
            ))}
          </select>
        </label>

        <label>
          <span className="label">To warehouse *</span>
          <select className="input" name="to_warehouse_id" required defaultValue={warehouses[1]?.id ?? ""}>
            <option value="">Select destination</option>
            {warehouses.map((warehouse) => (
              <option key={warehouse.id} value={warehouse.id}>{warehouse.code} - {warehouse.name}</option>
            ))}
          </select>
        </label>

        <label>
          <span className="label">Transfer date *</span>
          <input className="input" type="date" name="transfer_date" required defaultValue={today} />
        </label>

        <label>
          <span className="label">Notes</span>
          <input className="input" name="notes" placeholder="Transfer reason, vehicle, receiver, or document reference" />
        </label>
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Qty</th>
              <th>Unit cost</th>
              <th>Lot</th>
              <th>Serial</th>
              <th>Barcode</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={index}>
                <td>
                  <select
                    className="input"
                    value={item.product_id}
                    onChange={(event) => {
                      const product = products.find((entry) => entry.id === event.target.value);
                      patchItem(index, {
                        product_id: event.target.value,
                        unit_cost: Number(product?.cost_price ?? 0),
                        barcode: product?.barcode ?? "",
                      });
                    }}
                  >
                    <option value="">Select product</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>{product.sku} - {product.name}</option>
                    ))}
                  </select>
                </td>
                <td><input className="input" type="number" min="0.0001" step="0.0001" value={item.quantity} onChange={(event) => patchItem(index, { quantity: Number(event.target.value) })} /></td>
                <td><input className="input" type="number" min="0" step="0.0001" value={item.unit_cost} onChange={(event) => patchItem(index, { unit_cost: Number(event.target.value) })} /></td>
                <td><input className="input" value={item.lot_no} onChange={(event) => patchItem(index, { lot_no: event.target.value })} /></td>
                <td><input className="input" value={item.serial_no} onChange={(event) => patchItem(index, { serial_no: event.target.value })} /></td>
                <td><input className="input" value={item.barcode} onChange={(event) => patchItem(index, { barcode: event.target.value })} /></td>
                <td>
                  <button type="button" className="btn-secondary btn-small" disabled={items.length === 1} onClick={() => setItems((current) => current.filter((_, itemIndex) => itemIndex !== index))}>Remove</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="action-row justify-between">
        <button type="button" className="btn-secondary" onClick={() => setItems((current) => [...current, { ...emptyItem }])}>+ Add Item</button>
        <div className="font-black">Total qty {totalQuantity.toLocaleString("th-TH")}</div>
      </div>

      <button className="btn-primary">Post Transfer</button>
    </form>
  );
}
