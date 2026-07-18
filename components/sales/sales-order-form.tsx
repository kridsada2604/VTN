"use client";

import { useMemo, useState } from "react";

type Customer = { id: string; code: string; name: string };
type Product = { id: string; sku: string; name: string; selling_price: number };
type Warehouse = { id: string; code: string; name: string };
type TaxDefaults = { is_vat_registered: boolean; default_vat_rate: number; default_withholding_tax_rate: number };
type Item = { product_id: string | null; description: string; quantity: number; unit_price: number; discount_percent: number; tax_rate: number };

export function SalesOrderForm({
  customers,
  products,
  warehouses,
  taxDefaults,
  action,
}: {
  customers: Customer[];
  products: Product[];
  warehouses: Warehouse[];
  taxDefaults: TaxDefaults;
  action: (fd: FormData) => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const isVatRegistered = taxDefaults.is_vat_registered;
  const emptyItem: Item = {
    product_id: null,
    description: "",
    quantity: 1,
    unit_price: 0,
    discount_percent: 0,
    tax_rate: isVatRegistered ? taxDefaults.default_vat_rate : 0,
  };
  const [items, setItems] = useState<Item[]>([{ ...emptyItem }]);

  const totals = useMemo(
    () =>
      items.reduce(
        (acc, item) => {
          const subtotal = item.quantity * item.unit_price;
          const discount = (subtotal * item.discount_percent) / 100;
          const tax = isVatRegistered ? ((subtotal - discount) * item.tax_rate) / 100 : 0;
          return {
            subtotal: acc.subtotal + subtotal,
            discount: acc.discount + discount,
            tax: acc.tax + tax,
            total: acc.total + subtotal - discount + tax,
          };
        },
        { subtotal: 0, discount: 0, tax: 0, total: 0 },
      ),
    [items, isVatRegistered],
  );

  const patchItem = (index: number, patch: Partial<Item>) => {
    setItems((current) => current.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)));
  };

  return (
    <form action={action} className="card space-y-5 p-5">
      <input type="hidden" name="items" value={JSON.stringify(items)} />
      <div className="form-grid">
        <label>
          <span className="label">ลูกค้า *</span>
          <select className="input" name="customer_id" required>
            <option value="">เลือกลูกค้า</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>{customer.code} - {customer.name}</option>
            ))}
          </select>
        </label>
        <label>
          <span className="label">คลังสำหรับจอง</span>
          <select className="input" name="warehouse_id">
            <option value="">เลือกภายหลัง</option>
            {warehouses.map((warehouse) => (
              <option key={warehouse.id} value={warehouse.id}>{warehouse.code} - {warehouse.name}</option>
            ))}
          </select>
        </label>
        <label>
          <span className="label">วันที่ Sales Order *</span>
          <input className="input" type="date" name="order_date" required defaultValue={today} />
        </label>
        <label>
          <span className="label">วันที่ต้องการส่ง</span>
          <input className="input" type="date" name="requested_delivery_date" />
        </label>
        <label>
          <span className="label">เงื่อนไขชำระ</span>
          <input className="input" name="payment_terms" defaultValue="ชำระภายใน 30 วัน" />
        </label>
        <label>
          <span className="label">สกุลเงิน</span>
          <select className="input" name="currency_code" defaultValue="THB">
            <option>THB</option>
            <option>USD</option>
            <option>EUR</option>
          </select>
        </label>
        {isVatRegistered && (
          <label>
            <span className="label">ภาษีขาย</span>
            <input className="input" readOnly value={`${taxDefaults.default_vat_rate}%`} />
          </label>
        )}
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>สินค้า</th>
              <th>รายละเอียด</th>
              <th>จำนวน</th>
              <th>ราคา</th>
              <th>ส่วนลด %</th>
              {isVatRegistered && <th>VAT %</th>}
              <th>รวม</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => {
              const subtotal = item.quantity * item.unit_price;
              const discount = (subtotal * item.discount_percent) / 100;
              const tax = isVatRegistered ? ((subtotal - discount) * item.tax_rate) / 100 : 0;
              const total = subtotal - discount + tax;
              return (
                <tr key={index}>
                  <td>
                    <select
                      className="input"
                      value={item.product_id ?? ""}
                      onChange={(event) => {
                        const product = products.find((entry) => entry.id === event.target.value);
                        patchItem(index, {
                          product_id: event.target.value || null,
                          description: product?.name ?? "",
                          unit_price: Number(product?.selling_price ?? 0),
                          tax_rate: isVatRegistered ? taxDefaults.default_vat_rate : 0,
                        });
                      }}
                    >
                      <option value="">ไม่ผูกสินค้า</option>
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>{product.sku} - {product.name}</option>
                      ))}
                    </select>
                  </td>
                  <td><input className="input" value={item.description} onChange={(event) => patchItem(index, { description: event.target.value })} /></td>
                  <td><input className="input" type="number" min="0.0001" step="0.0001" value={item.quantity} onChange={(event) => patchItem(index, { quantity: Number(event.target.value) })} /></td>
                  <td><input className="input" type="number" min="0" step="0.01" value={item.unit_price} onChange={(event) => patchItem(index, { unit_price: Number(event.target.value) })} /></td>
                  <td><input className="input" type="number" min="0" step="0.01" value={item.discount_percent} onChange={(event) => patchItem(index, { discount_percent: Number(event.target.value) })} /></td>
                  {isVatRegistered && <td><input className="input" type="number" min="0" step="0.01" value={item.tax_rate} onChange={(event) => patchItem(index, { tax_rate: Number(event.target.value) })} /></td>}
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
        <div className="space-y-2 rounded-2xl bg-slate-50 p-5">
          <div className="flex justify-between"><span>ยอดก่อนส่วนลด</span><b>฿{totals.subtotal.toLocaleString("th-TH", { minimumFractionDigits: 2 })}</b></div>
          <div className="flex justify-between"><span>ส่วนลด</span><b>฿{totals.discount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}</b></div>
          {isVatRegistered && <div className="flex justify-between"><span>ภาษี</span><b>฿{totals.tax.toLocaleString("th-TH", { minimumFractionDigits: 2 })}</b></div>}
          <div className="mt-3 flex justify-between border-t pt-3 text-xl"><span className="font-black">ยอดสุทธิ</span><b>฿{totals.total.toLocaleString("th-TH", { minimumFractionDigits: 2 })}</b></div>
        </div>
      </div>

      <button className="btn-primary">บันทึก Sales Order</button>
    </form>
  );
}
