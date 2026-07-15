"use client";

import { useMemo, useState } from "react";

type Customer = { id: string; code: string; name: string };
type Product = { id: string; sku: string; name: string; barcode: string | null; selling_price: number };
type Warehouse = { id: string; code: string; name: string };
type Item = { product_id: string; description: string; quantity: number; unit_price: number; line_discount: number; line_tax: number; barcode: string | null };

const emptyItem: Item = { product_id: "", description: "", quantity: 1, unit_price: 0, line_discount: 0, line_tax: 0, barcode: null };

export function PosSaleForm({
  customers,
  products,
  warehouses,
  action,
}: {
  customers: Customer[];
  products: Product[];
  warehouses: Warehouse[];
  action: (fd: FormData) => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [items, setItems] = useState<Item[]>([{ ...emptyItem }]);

  const totals = useMemo(
    () =>
      items.reduce(
        (acc, item) => {
          const subtotal = item.quantity * item.unit_price;
          const total = subtotal - item.line_discount + item.line_tax;
          return { subtotal: acc.subtotal + subtotal, discount: acc.discount + item.line_discount, tax: acc.tax + item.line_tax, total: acc.total + total };
        },
        { subtotal: 0, discount: 0, tax: 0, total: 0 },
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
          <span className="label">คลังสินค้า *</span>
          <select className="input" name="warehouse_id" required>
            <option value="">เลือกคลัง</option>
            {warehouses.map((warehouse) => (
              <option key={warehouse.id} value={warehouse.id}>
                {warehouse.code} - {warehouse.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="label">ลูกค้า</span>
          <select className="input" name="customer_id">
            <option value="">ลูกค้าทั่วไป</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.code} - {customer.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="label">วันที่ขาย *</span>
          <input className="input" type="date" name="sale_date" required defaultValue={today} />
        </label>
        <label>
          <span className="label">วิธีชำระเงิน</span>
          <select className="input" name="payment_method" defaultValue="CASH">
            <option value="CASH">เงินสด</option>
            <option value="TRANSFER">โอนเงิน</option>
            <option value="CARD">บัตร</option>
            <option value="QR">QR</option>
            <option value="MIXED">หลายช่องทาง</option>
          </select>
        </label>
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr><th>สินค้า</th><th>Barcode</th><th>จำนวน</th><th>ราคา</th><th>ส่วนลด</th><th>VAT</th><th>รวม</th><th /></tr>
          </thead>
          <tbody>
            {items.map((item, index) => {
              const lineTotal = item.quantity * item.unit_price - item.line_discount + item.line_tax;
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
                          description: product?.name ?? "",
                          unit_price: Number(product?.selling_price ?? 0),
                          barcode: product?.barcode ?? null,
                        });
                      }}
                    >
                      <option value="">เลือกสินค้า</option>
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.sku} - {product.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td><input className="input" value={item.barcode ?? ""} onChange={(event) => patchItem(index, { barcode: event.target.value || null })} /></td>
                  <td><input className="input" type="number" min="0.0001" step="0.0001" value={item.quantity} onChange={(event) => patchItem(index, { quantity: Number(event.target.value) })} /></td>
                  <td><input className="input" type="number" min="0" step="0.01" value={item.unit_price} onChange={(event) => patchItem(index, { unit_price: Number(event.target.value) })} /></td>
                  <td><input className="input" type="number" min="0" step="0.01" value={item.line_discount} onChange={(event) => patchItem(index, { line_discount: Number(event.target.value) })} /></td>
                  <td><input className="input" type="number" min="0" step="0.01" value={item.line_tax} onChange={(event) => patchItem(index, { line_tax: Number(event.target.value) })} /></td>
                  <td className="font-bold">฿{lineTotal.toLocaleString("th-TH", { minimumFractionDigits: 2 })}</td>
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
        <div className="space-y-3 rounded-2xl bg-slate-50 p-5">
          <div className="flex justify-between"><span>ยอดก่อนส่วนลด</span><b>฿{totals.subtotal.toLocaleString("th-TH", { minimumFractionDigits: 2 })}</b></div>
          <div className="flex justify-between"><span>ส่วนลด</span><b>฿{totals.discount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}</b></div>
          <div className="flex justify-between"><span>VAT</span><b>฿{totals.tax.toLocaleString("th-TH", { minimumFractionDigits: 2 })}</b></div>
          <div className="flex justify-between border-t pt-3 text-xl"><span className="font-black">ยอดสุทธิ</span><b>฿{totals.total.toLocaleString("th-TH", { minimumFractionDigits: 2 })}</b></div>
          <label>
            <span className="label">รับเงิน *</span>
            <input className="input" type="number" min={totals.total} step="0.01" name="paid_amount" required defaultValue={totals.total.toFixed(2)} />
          </label>
        </div>
      </div>

      <button className="btn-primary">บันทึกขาย POS</button>
    </form>
  );
}
