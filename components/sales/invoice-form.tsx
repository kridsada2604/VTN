"use client";

import { useMemo, useState } from "react";

type Customer = { id: string; code: string; name: string };
type Product = { id: string; sku: string; name: string; selling_price: number };
type TaxDefaults = { is_vat_registered: boolean; default_vat_rate: number; default_withholding_tax_rate: number };
type Item = { product_id: string; description: string; quantity: number; unit_price: number; discount_percent: number; tax_rate: number };

export function InvoiceForm({ customers, products, taxDefaults, action }: { customers: Customer[]; products: Product[]; taxDefaults: TaxDefaults; action: (fd: FormData) => void }) {
  const today = new Date().toISOString().slice(0, 10);
  const emptyItem: Item = { product_id: "", description: "", quantity: 1, unit_price: 0, discount_percent: 0, tax_rate: taxDefaults.is_vat_registered ? taxDefaults.default_vat_rate : 0 };
  const [isVatRegistered, setIsVatRegistered] = useState(taxDefaults.is_vat_registered);
  const [withholdingTaxRate, setWithholdingTaxRate] = useState(taxDefaults.default_withholding_tax_rate);
  const [installmentCount, setInstallmentCount] = useState(1);
  const [items, setItems] = useState<Item[]>([{ ...emptyItem }]);

  const totals = useMemo(() => {
    const result = items.reduce((acc, item) => {
      const subtotal = item.quantity * item.unit_price;
      const discount = (subtotal * item.discount_percent) / 100;
      const tax = isVatRegistered ? ((subtotal - discount) * item.tax_rate) / 100 : 0;
      return { subtotal: acc.subtotal + subtotal, discount: acc.discount + discount, tax: acc.tax + tax };
    }, { subtotal: 0, discount: 0, tax: 0 });
    const taxableBase = result.subtotal - result.discount;
    const grandTotal = taxableBase + result.tax;
    const withholding = (taxableBase * withholdingTaxRate) / 100;
    return { ...result, grandTotal, withholding, netPayable: grandTotal - withholding };
  }, [items, isVatRegistered, withholdingTaxRate]);

  const patchItem = (index: number, patch: Partial<Item>) => setItems((current) => current.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)));

  return (
    <form action={action} className="card p-5 space-y-5">
      <input type="hidden" name="items" value={JSON.stringify(items)} />
      <input type="hidden" name="is_vat_registered" value={String(isVatRegistered)} />
      <input type="hidden" name="withholding_tax_rate" value={String(withholdingTaxRate)} />
      <input type="hidden" name="installment_count" value={String(installmentCount)} />

      <div className="form-grid">
        <label><span className="label">Customer *</span><select className="input" name="customer_id" required><option value="">Select customer</option>{customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.code} - {customer.name}</option>)}</select></label>
        <label><span className="label">Invoice Date *</span><input className="input" type="date" name="invoice_date" required defaultValue={today} /></label>
        <label><span className="label">Due Date</span><input className="input" type="date" name="due_date" /></label>
        <label><span className="label">Currency</span><select className="input" name="currency_code" defaultValue="THB"><option>THB</option><option>USD</option><option>EUR</option></select></label>
        {isVatRegistered && <label><span className="label">Sales VAT</span><input className="input" readOnly value={`${taxDefaults.default_vat_rate}%`} /></label>}
        <label><span className="label">WHT Rate (%)</span><input className="input" type="number" min="0" max="100" step="0.01" value={withholdingTaxRate} onChange={(event) => setWithholdingTaxRate(Number(event.target.value))} /></label>
        <label><span className="label">Payment Installments</span><input className="input" type="number" min="1" max="24" step="1" value={installmentCount} onChange={(event) => setInstallmentCount(Math.max(1, Number(event.target.value) || 1))} /></label>
        <label className="full"><span className="label">Payment Terms</span><input className="input" name="payment_terms" defaultValue="Payment within 30 days" /></label>
      </div>

      <div className="table-wrap"><table className="data-table"><thead><tr><th>Product</th><th>Description</th><th>Qty</th><th>Price</th><th>Discount %</th>{isVatRegistered && <th>VAT %</th>}<th>Total</th><th /></tr></thead><tbody>{items.map((item, index) => { const subtotal = item.quantity * item.unit_price; const discount = subtotal * item.discount_percent / 100; const tax = isVatRegistered ? (subtotal - discount) * item.tax_rate / 100 : 0; const total = subtotal - discount + tax; return <tr key={index}><td><select className="input" value={item.product_id} onChange={(event) => { const product = products.find((entry) => entry.id === event.target.value); patchItem(index, { product_id: event.target.value, description: product?.name ?? "", unit_price: Number(product?.selling_price ?? 0) }); }}><option value="">No product link</option>{products.map((product) => <option key={product.id} value={product.id}>{product.sku} - {product.name}</option>)}</select></td><td><input className="input" value={item.description} onChange={(event) => patchItem(index, { description: event.target.value })} /></td><td><input className="input" type="number" min="0.0001" step="0.0001" value={item.quantity} onChange={(event) => patchItem(index, { quantity: Number(event.target.value) })} /></td><td><input className="input" type="number" min="0" step="0.01" value={item.unit_price} onChange={(event) => patchItem(index, { unit_price: Number(event.target.value) })} /></td><td><input className="input" type="number" min="0" max="100" step="0.01" value={item.discount_percent} onChange={(event) => patchItem(index, { discount_percent: Number(event.target.value) })} /></td>{isVatRegistered && <td><input className="input" type="number" min="0" step="0.01" value={item.tax_rate} onChange={(event) => patchItem(index, { tax_rate: Number(event.target.value) })} /></td>}<td className="font-bold">THB {total.toLocaleString("th-TH", { minimumFractionDigits: 2 })}</td><td><button type="button" className="btn-secondary btn-small" disabled={items.length === 1} onClick={() => setItems((current) => current.filter((_, itemIndex) => itemIndex !== index))}>Remove</button></td></tr>; })}</tbody></table></div>
      <button type="button" className="btn-secondary" onClick={() => setItems((current) => [...current, { ...emptyItem }])}>+ Add item</button>

      <div className="grid gap-5 lg:grid-cols-[1fr_360px]"><label><span className="label">Notes</span><textarea className="input textarea min-h-36" name="notes" /></label><div className="rounded-2xl bg-slate-50 p-5 space-y-2"><div className="flex justify-between"><span>Subtotal</span><b>THB {totals.subtotal.toLocaleString("th-TH", { minimumFractionDigits: 2 })}</b></div><div className="flex justify-between"><span>Discount</span><b>THB {totals.discount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}</b></div>{isVatRegistered && <div className="flex justify-between"><span>VAT</span><b>THB {totals.tax.toLocaleString("th-TH", { minimumFractionDigits: 2 })}</b></div>}<div className="flex justify-between"><span>Grand Total</span><b>THB {totals.grandTotal.toLocaleString("th-TH", { minimumFractionDigits: 2 })}</b></div><div className="flex justify-between"><span>WHT</span><b>THB {totals.withholding.toLocaleString("th-TH", { minimumFractionDigits: 2 })}</b></div><div className="mt-3 flex justify-between border-t pt-3 text-xl"><span className="font-black">Net Payable</span><b>THB {totals.netPayable.toLocaleString("th-TH", { minimumFractionDigits: 2 })}</b></div></div></div>
      <div className="action-row"><button className="btn-primary">Save Invoice</button></div>
    </form>
  );
}