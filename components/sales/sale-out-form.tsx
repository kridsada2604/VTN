"use client";

import { useMemo, useState } from "react";

type Dealer = { id: string; code: string; name: string };
type Product = { id: string; sku: string; name: string; selling_price: number };
type Salesperson = { user_id: string; profiles: { full_name: string | null; email: string | null }[] | null };
type Item = {
  product_id: string;
  dealer_sku: string;
  description: string;
  quantity: number;
  unit_price: number;
  line_discount: number;
};

const emptyItem: Item = {
  product_id: "",
  dealer_sku: "",
  description: "",
  quantity: 1,
  unit_price: 0,
  line_discount: 0,
};

export function SaleOutForm({
  dealers,
  products,
  salespeople,
  action,
}: {
  dealers: Dealer[];
  products: Product[];
  salespeople: Salesperson[];
  action: (fd: FormData) => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [items, setItems] = useState<Item[]>([{ ...emptyItem }]);

  const totals = useMemo(
    () =>
      items.reduce(
        (acc, item) => {
          const gross = item.quantity * item.unit_price;
          const net = Math.max(gross - item.line_discount, 0);
          return {
            gross: acc.gross + gross,
            discount: acc.discount + item.line_discount,
            net: acc.net + net,
          };
        },
        { gross: 0, discount: 0, net: 0 },
      ),
    [items],
  );

  const patchItem = (index: number, patch: Partial<Item>) => {
    setItems((current) => current.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)));
  };

  return (
    <form action={action} className="card space-y-5 p-5">
      <input type="hidden" name="items" value={JSON.stringify(items)} />
      <div className="form-grid">
        <label>
          <span className="label">Dealer *</span>
          <select className="input" name="dealer_id" required>
            <option value="">Select dealer</option>
            {dealers.map((dealer) => (
              <option key={dealer.id} value={dealer.id}>
                {dealer.code} - {dealer.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="label">Salesperson</span>
          <select className="input" name="salesperson_id">
            <option value="">Unassigned</option>
            {salespeople.map((person) => {
              const profile = person.profiles?.[0];
              return (
                <option key={person.user_id} value={person.user_id}>
                  {profile?.full_name ?? profile?.email ?? person.user_id}
                </option>
              );
            })}
          </select>
        </label>
        <label>
          <span className="label">Report date *</span>
          <input className="input" type="date" name="report_date" required defaultValue={today} />
        </label>
        <label>
          <span className="label">Source</span>
          <select className="input" name="source_channel" defaultValue="DEALER">
            <option value="DEALER">Dealer</option>
            <option value="MARKETPLACE">Marketplace</option>
            <option value="POS">POS</option>
            <option value="MANUAL">Manual</option>
            <option value="OTHER">Other</option>
          </select>
        </label>
        <label>
          <span className="label">Period start *</span>
          <input className="input" type="date" name="period_start" required defaultValue={today.slice(0, 8) + "01"} />
        </label>
        <label>
          <span className="label">Period end *</span>
          <input className="input" type="date" name="period_end" required defaultValue={today} />
        </label>
        <label>
          <span className="label">Currency</span>
          <select className="input" name="currency_code" defaultValue="THB">
            <option>THB</option>
            <option>USD</option>
          </select>
        </label>
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Dealer SKU</th>
              <th>Description</th>
              <th>Qty</th>
              <th>Unit Price</th>
              <th>Discount</th>
              <th>Net</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => {
              const net = Math.max(item.quantity * item.unit_price - item.line_discount, 0);
              return (
                <tr key={index}>
                  <td>
                    <select
                      className="input"
                      value={item.product_id}
                      onChange={(event) => {
                        const product = products.find((entry) => entry.id === event.target.value);
                        patchItem(index, {
                          product_id: event.target.value,
                          dealer_sku: product?.sku ?? item.dealer_sku,
                          description: product?.name ?? item.description,
                          unit_price: Number(product?.selling_price ?? item.unit_price),
                        });
                      }}
                    >
                      <option value="">Unmapped</option>
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.sku} - {product.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td><input className="input" value={item.dealer_sku} onChange={(event) => patchItem(index, { dealer_sku: event.target.value })} /></td>
                  <td><input className="input" required value={item.description} onChange={(event) => patchItem(index, { description: event.target.value })} /></td>
                  <td><input className="input" type="number" min="0.0001" step="0.0001" value={item.quantity} onChange={(event) => patchItem(index, { quantity: Number(event.target.value) })} /></td>
                  <td><input className="input" type="number" min="0" step="0.01" value={item.unit_price} onChange={(event) => patchItem(index, { unit_price: Number(event.target.value) })} /></td>
                  <td><input className="input" type="number" min="0" step="0.01" value={item.line_discount} onChange={(event) => patchItem(index, { line_discount: Number(event.target.value) })} /></td>
                  <td className="font-bold">฿{net.toLocaleString("th-TH", { minimumFractionDigits: 2 })}</td>
                  <td>
                    <button type="button" className="btn-secondary btn-small" disabled={items.length === 1} onClick={() => setItems((current) => current.filter((_, itemIndex) => itemIndex !== index))}>
                      Remove
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <button type="button" className="btn-secondary" onClick={() => setItems((current) => [...current, { ...emptyItem }])}>
        + Add item
      </button>

      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <label>
          <span className="label">Notes</span>
          <textarea className="input textarea min-h-36" name="notes" />
        </label>
        <div className="space-y-2 rounded-2xl bg-slate-50 p-5">
          <div className="flex justify-between"><span>Gross</span><b>฿{totals.gross.toLocaleString("th-TH", { minimumFractionDigits: 2 })}</b></div>
          <div className="flex justify-between"><span>Discount</span><b>฿{totals.discount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}</b></div>
          <div className="mt-3 flex justify-between border-t pt-3 text-xl"><span className="font-black">Net Sale Out</span><b>฿{totals.net.toLocaleString("th-TH", { minimumFractionDigits: 2 })}</b></div>
        </div>
      </div>

      <div className="action-row">
        <button className="btn-primary">Save Sale Out</button>
      </div>
    </form>
  );
}
