"use client";

import { useMemo, useState } from "react";

type Channel = { id: string; name: string; platform: string; shop_code: string };
type Product = { id: string; sku: string; name: string; selling_price: number };
type Item = { product_id: string | null; marketplace_sku: string; description: string; quantity: number; unit_price: number; line_discount: number };

const emptyItem: Item = { product_id: null, marketplace_sku: "", description: "", quantity: 1, unit_price: 0, line_discount: 0 };

export function MarketplaceOrderForm({
  channels,
  products,
  action,
}: {
  channels: Channel[];
  products: Product[];
  action: (fd: FormData) => void;
}) {
  const now = new Date().toISOString().slice(0, 16);
  const [items, setItems] = useState<Item[]>([{ ...emptyItem }]);
  const [shippingFee, setShippingFee] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [taxAmount, setTaxAmount] = useState(0);

  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
    const itemDiscount = items.reduce((sum, item) => sum + item.line_discount, 0);
    return {
      subtotal,
      discount: itemDiscount + discountAmount,
      total: subtotal - itemDiscount - discountAmount + shippingFee + taxAmount,
    };
  }, [discountAmount, items, shippingFee, taxAmount]);

  const patchItem = (index: number, patch: Partial<Item>) => {
    setItems((current) => current.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)));
  };

  return (
    <form action={action} className="card space-y-5 p-5">
      <input type="hidden" name="items" value={JSON.stringify(items)} />
      <div className="form-grid">
        <label>
          <span className="label">ช่องทาง *</span>
          <select className="input" name="channel_id" required>
            <option value="">เลือกช่องทาง</option>
            {channels.map((channel) => (
              <option key={channel.id} value={channel.id}>{channel.platform} - {channel.name}</option>
            ))}
          </select>
        </label>
        <label>
          <span className="label">เลขออเดอร์ Marketplace *</span>
          <input className="input" name="external_order_no" required placeholder="MP-ORDER-0001" />
        </label>
        <label>
          <span className="label">วันที่ออเดอร์ *</span>
          <input className="input" type="datetime-local" name="order_date" required defaultValue={now} />
        </label>
        <label>
          <span className="label">ชื่อลูกค้า *</span>
          <input className="input" name="buyer_name" required placeholder="ลูกค้า Marketplace" />
        </label>
        <label>
          <span className="label">เบอร์โทร</span>
          <input className="input" name="buyer_phone" />
        </label>
        <label>
          <span className="label">ค่าส่ง</span>
          <input className="input" type="number" min="0" step="0.01" name="shipping_fee" value={shippingFee} onChange={(event) => setShippingFee(Number(event.target.value))} />
        </label>
      </div>

      <label>
        <span className="label">ที่อยู่จัดส่ง</span>
        <textarea className="input textarea" name="shipping_address" />
      </label>

      <div className="table-wrap">
        <table className="data-table">
          <thead><tr><th>SKU Marketplace</th><th>สินค้าในระบบ</th><th>รายละเอียด</th><th>จำนวน</th><th>ราคา</th><th>ส่วนลด</th><th>รวม</th><th /></tr></thead>
          <tbody>
            {items.map((item, index) => {
              const lineTotal = item.quantity * item.unit_price - item.line_discount;
              return (
                <tr key={index}>
                  <td><input className="input" value={item.marketplace_sku} onChange={(event) => patchItem(index, { marketplace_sku: event.target.value })} /></td>
                  <td>
                    <select
                      className="input"
                      value={item.product_id ?? ""}
                      onChange={(event) => {
                        const product = products.find((entry) => entry.id === event.target.value);
                        patchItem(index, {
                          product_id: event.target.value || null,
                          marketplace_sku: item.marketplace_sku || product?.sku || "",
                          description: product?.name ?? item.description,
                          unit_price: Number(product?.selling_price ?? item.unit_price),
                        });
                      }}
                    >
                      <option value="">ยังไม่ map</option>
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>{product.sku} - {product.name}</option>
                      ))}
                    </select>
                  </td>
                  <td><input className="input" value={item.description} onChange={(event) => patchItem(index, { description: event.target.value })} /></td>
                  <td><input className="input" type="number" min="0.0001" step="0.0001" value={item.quantity} onChange={(event) => patchItem(index, { quantity: Number(event.target.value) })} /></td>
                  <td><input className="input" type="number" min="0" step="0.01" value={item.unit_price} onChange={(event) => patchItem(index, { unit_price: Number(event.target.value) })} /></td>
                  <td><input className="input" type="number" min="0" step="0.01" value={item.line_discount} onChange={(event) => patchItem(index, { line_discount: Number(event.target.value) })} /></td>
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
        <div className="form-grid">
          <label>
            <span className="label">ส่วนลดท้ายบิล</span>
            <input className="input" type="number" min="0" step="0.01" name="discount_amount" value={discountAmount} onChange={(event) => setDiscountAmount(Number(event.target.value))} />
          </label>
          <label>
            <span className="label">ภาษี</span>
            <input className="input" type="number" min="0" step="0.01" name="tax_amount" value={taxAmount} onChange={(event) => setTaxAmount(Number(event.target.value))} />
          </label>
        </div>
        <div className="space-y-2 rounded-2xl bg-slate-50 p-5">
          <div className="flex justify-between"><span>ยอดสินค้า</span><b>฿{totals.subtotal.toLocaleString("th-TH", { minimumFractionDigits: 2 })}</b></div>
          <div className="flex justify-between"><span>ส่วนลดรวม</span><b>฿{totals.discount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}</b></div>
          <div className="flex justify-between"><span>ค่าส่ง</span><b>฿{shippingFee.toLocaleString("th-TH", { minimumFractionDigits: 2 })}</b></div>
          <div className="flex justify-between"><span>ภาษี</span><b>฿{taxAmount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}</b></div>
          <div className="mt-3 flex justify-between border-t pt-3 text-xl"><span className="font-black">ยอดสุทธิ</span><b>฿{totals.total.toLocaleString("th-TH", { minimumFractionDigits: 2 })}</b></div>
        </div>
      </div>

      <button className="btn-primary">Import Order</button>
    </form>
  );
}
