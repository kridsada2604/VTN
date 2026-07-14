"use client";

import { useMemo, useState } from "react";

type Supplier = { id: string; code: string; name: string };
type Product = { id: string; sku: string; name: string; cost_price: number };
type Item = { product_id: string; description: string; quantity: number; unit_cost: number; discount_percent: number; tax_rate: number };

const emptyItem: Item = { product_id: "", description: "", quantity: 1, unit_cost: 0, discount_percent: 0, tax_rate: 7 };

export function PurchaseOrderForm({ suppliers, products, action }: { suppliers: Supplier[]; products: Product[]; action: (fd: FormData) => void }) {
  const today = new Date().toISOString().slice(0, 10);
  const [items, setItems] = useState<Item[]>([{ ...emptyItem }]);
  const totals = useMemo(
    () =>
      items.reduce(
        (acc, item) => {
          const subtotal = item.quantity * item.unit_cost;
          const discount = (subtotal * item.discount_percent) / 100;
          const tax = ((subtotal - discount) * item.tax_rate) / 100;
          return { subtotal: acc.subtotal + subtotal, discount: acc.discount + discount, tax: acc.tax + tax, total: acc.total + subtotal - discount + tax };
        },
        { subtotal: 0, discount: 0, tax: 0, total: 0 },
      ),
    [items],
  );

  const patchItem = (index: number, patch: Partial<Item>) => {
    setItems((current) => current.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)));
  };

  return (
    <form action={action} className="card p-5 space-y-5">
      <input type="hidden" name="items" value={JSON.stringify(items)} />
      <div className="form-grid">
        <label>
          <span className="label">Supplier *</span>
          <select className="input" name="supplier_id" required>
            <option value="">เลือก Supplier</option>
            {suppliers.map((supplier) => (
              <option key={supplier.id} value={supplier.id}>
                {supplier.code} - {supplier.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="label">วันที่ใบสั่งซื้อ *</span>
          <input className="input" type="date" name="order_date" required defaultValue={today} />
        </label>
        <label>
          <span className="label">กำหนดรับของ</span>
          <input className="input" type="date" name="expected_date" />
        </label>
        <label>
          <span className="label">สกุลเงิน</span>
          <select className="input" name="currency_code" defaultValue="THB">
            <option>THB</option>
            <option>USD</option>
            <option>EUR</option>
          </select>
        </label>
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>สินค้า</th>
              <th>รายละเอียด</th>
              <th>จำนวน</th>
              <th>ต้นทุน</th>
              <th>ส่วนลด %</th>
              <th>VAT %</th>
              <th>รวม</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => {
              const subtotal = item.quantity * item.unit_cost;
              const discount = (subtotal * item.discount_percent) / 100;
              const tax = ((subtotal - discount) * item.tax_rate) / 100;
              const total = subtotal - discount + tax;
              return (
                <tr key={index}>
                  <td>
                    <select
                      className="input"
                      value={item.product_id}
                      onChange={(event) => {
                        const product = products.find((entry) => entry.id === event.target.value);
                        patchItem(index, { product_id: event.target.value, description: product?.name ?? "", unit_cost: Number(product?.cost_price ?? 0) });
                      }}
                    >
                      <option value="">ไม่ผูกสินค้า</option>
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.sku} - {product.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td><input className="input" value={item.description} onChange={(event) => patchItem(index, { description: event.target.value })} /></td>
                  <td><input className="input" type="number" min="0.0001" step="0.0001" value={item.quantity} onChange={(event) => patchItem(index, { quantity: Number(event.target.value) })} /></td>
                  <td><input className="input" type="number" min="0" step="0.0001" value={item.unit_cost} onChange={(event) => patchItem(index, { unit_cost: Number(event.target.value) })} /></td>
                  <td><input className="input" type="number" min="0" max="100" step="0.01" value={item.discount_percent} onChange={(event) => patchItem(index, { discount_percent: Number(event.target.value) })} /></td>
                  <td><input className="input" type="number" min="0" step="0.01" value={item.tax_rate} onChange={(event) => patchItem(index, { tax_rate: Number(event.target.value) })} /></td>
                  <td className="font-bold">฿{total.toLocaleString("th-TH", { minimumFractionDigits: 2 })}</td>
                  <td><button type="button" className="btn-secondary btn-small" disabled={items.length === 1} onClick={() => setItems((current) => current.filter((_, itemIndex) => itemIndex !== index))}>ลบ</button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <button type="button" className="btn-secondary" onClick={() => setItems((current) => [...current, { ...emptyItem }])}>+ เพิ่มรายการ</button>

      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <label><span className="label">หมายเหตุ</span><textarea className="input textarea min-h-36" name="notes" /></label>
        <div className="rounded-2xl bg-slate-50 p-5 space-y-2">
          <div className="flex justify-between"><span>ยอดก่อนส่วนลด</span><b>฿{totals.subtotal.toLocaleString("th-TH", { minimumFractionDigits: 2 })}</b></div>
          <div className="flex justify-between"><span>ส่วนลด</span><b>฿{totals.discount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}</b></div>
          <div className="flex justify-between"><span>ภาษี</span><b>฿{totals.tax.toLocaleString("th-TH", { minimumFractionDigits: 2 })}</b></div>
          <div className="mt-3 flex justify-between border-t pt-3 text-xl"><span className="font-black">ยอดสุทธิ</span><b>฿{totals.total.toLocaleString("th-TH", { minimumFractionDigits: 2 })}</b></div>
        </div>
      </div>

      <button className="btn-primary">บันทึกใบสั่งซื้อ</button>
    </form>
  );
}
