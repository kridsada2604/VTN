"use client";

import { useEffect, useMemo, useState } from "react";

type Customer = { id: string; code: string; name: string };
type Product = { id: string; sku: string; name: string; selling_price: number };
type TaxDefaults = { is_vat_registered: boolean; default_vat_rate: number; default_withholding_tax_rate: number };
type Item = { product_id: string; description: string; quantity: number; unit_price: number; discount_percent: number; tax_rate: number };
type Draft = {
  customer_id: string;
  quotation_date: string;
  valid_until: string;
  salesperson: string;
  project_name: string;
  payment_terms: string;
  currency_code: string;
  notes: string;
  is_vat_registered: boolean;
  withholding_tax_rate: number;
  installment_count: number;
  items: Item[];
};

const draftKey = "vtn:quotation-draft:v2";

export function QuotationForm({
  customers,
  products,
  taxDefaults,
  action,
}: {
  customers: Customer[];
  products: Product[];
  taxDefaults: TaxDefaults;
  action: (fd: FormData) => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const emptyItem: Item = { product_id: "", description: "", quantity: 1, unit_price: 0, discount_percent: 0, tax_rate: taxDefaults.is_vat_registered ? taxDefaults.default_vat_rate : 0 };
  const [draft, setDraft] = useState<Draft>({
    customer_id: "",
    quotation_date: today,
    valid_until: "",
    salesperson: "",
    project_name: "",
    payment_terms: "Payment within 30 days",
    currency_code: "THB",
    notes: "",
    is_vat_registered: taxDefaults.is_vat_registered,
    withholding_tax_rate: taxDefaults.default_withholding_tax_rate,
    installment_count: 1,
    items: [{ ...emptyItem }],
  });
  const [restored, setRestored] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const saved = localStorage.getItem(draftKey);
        if (saved) {
          setDraft(JSON.parse(saved));
          setRestored(true);
        }
      } catch {}
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(draftKey, JSON.stringify(draft));
      } catch {}
    }, 500);
    return () => clearTimeout(timer);
  }, [draft]);

  const totals = useMemo(
    () => {
      const result = draft.items.reduce(
        (acc, item) => {
          const subtotal = item.quantity * item.unit_price;
          const discount = (subtotal * item.discount_percent) / 100;
          const tax = draft.is_vat_registered ? ((subtotal - discount) * item.tax_rate) / 100 : 0;
          return { subtotal: acc.subtotal + subtotal, discount: acc.discount + discount, tax: acc.tax + tax };
        },
        { subtotal: 0, discount: 0, tax: 0 },
      );
      const taxableBase = result.subtotal - result.discount;
      const grandTotal = taxableBase + result.tax;
      const withholding = (taxableBase * draft.withholding_tax_rate) / 100;
      return { ...result, grandTotal, withholding, netPayable: grandTotal - withholding };
    },
    [draft.items, draft.is_vat_registered, draft.withholding_tax_rate],
  );

  const patchItem = (index: number, patch: Partial<Item>) => setDraft((current) => ({ ...current, items: current.items.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)) }));
  const field = (key: keyof Omit<Draft, "items">, value: string | number | boolean) => setDraft((current) => ({ ...current, [key]: value }));

  return (
    <form action={async (fd) => { localStorage.removeItem(draftKey); await action(fd); }} className="card p-5 space-y-5">
      <input type="hidden" name="items" value={JSON.stringify(draft.items)} />
      <input type="hidden" name="is_vat_registered" value={String(draft.is_vat_registered)} />
      <input type="hidden" name="withholding_tax_rate" value={String(draft.withholding_tax_rate)} />
      <input type="hidden" name="installment_count" value={String(draft.installment_count)} />
      {restored && <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">Restored latest local draft.</div>}

      <div className="form-grid">
        <label><span className="label">Customer *</span><select className="input" name="customer_id" required value={draft.customer_id} onChange={(event) => field("customer_id", event.target.value)}><option value="">Select customer</option>{customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.code} - {customer.name}</option>)}</select></label>
        <label><span className="label">Quotation Date *</span><input className="input" type="date" name="quotation_date" required value={draft.quotation_date} onChange={(event) => field("quotation_date", event.target.value)} /></label>
        <label><span className="label">Valid Until</span><input className="input" type="date" name="valid_until" value={draft.valid_until} onChange={(event) => field("valid_until", event.target.value)} /></label>
        <label><span className="label">Salesperson</span><input className="input" name="salesperson" value={draft.salesperson} onChange={(event) => field("salesperson", event.target.value)} /></label>
        <label><span className="label">Project / Job</span><input className="input" name="project_name" value={draft.project_name} onChange={(event) => field("project_name", event.target.value)} /></label>
        <label><span className="label">Currency</span><select className="input" name="currency_code" value={draft.currency_code} onChange={(event) => field("currency_code", event.target.value)}><option>THB</option><option>USD</option><option>EUR</option></select></label>
        <label><span className="label">VAT Status</span><select className="input" value={String(draft.is_vat_registered)} onChange={(event) => { const registered = event.target.value === "true"; setDraft((current) => ({ ...current, is_vat_registered: registered, items: current.items.map((item) => ({ ...item, tax_rate: registered ? taxDefaults.default_vat_rate : 0 })) })); }}><option value="true">VAT registered</option><option value="false">Not VAT registered</option></select></label>
        <label><span className="label">WHT Rate (%)</span><input className="input" type="number" min="0" max="100" step="0.01" value={draft.withholding_tax_rate} onChange={(event) => field("withholding_tax_rate", Number(event.target.value))} /></label>
        <label><span className="label">Payment Installments</span><input className="input" type="number" min="1" max="24" step="1" value={draft.installment_count} onChange={(event) => field("installment_count", Math.max(1, Number(event.target.value) || 1))} /></label>
        <label className="full"><span className="label">Payment Terms</span><input className="input" name="payment_terms" value={draft.payment_terms} onChange={(event) => field("payment_terms", event.target.value)} /></label>
      </div>

      <div className="table-wrap"><table className="data-table"><thead><tr><th>Product</th><th>Description</th><th>Qty</th><th>Price</th><th>Discount %</th><th>VAT %</th><th>Total</th><th /></tr></thead><tbody>{draft.items.map((item, index) => { const subtotal = item.quantity * item.unit_price; const discount = subtotal * item.discount_percent / 100; const tax = draft.is_vat_registered ? (subtotal - discount) * item.tax_rate / 100 : 0; const total = subtotal - discount + tax; return <tr key={index}><td><select className="input" value={item.product_id} onChange={(event) => { const product = products.find((entry) => entry.id === event.target.value); patchItem(index, { product_id: event.target.value, description: product?.name || "", unit_price: Number(product?.selling_price || 0) }); }}><option value="">No product link</option>{products.map((product) => <option key={product.id} value={product.id}>{product.sku} - {product.name}</option>)}</select></td><td><input className="input" value={item.description} onChange={(event) => patchItem(index, { description: event.target.value })} /></td><td><input className="input" type="number" min="0.0001" step="0.0001" value={item.quantity} onChange={(event) => patchItem(index, { quantity: Number(event.target.value) })} /></td><td><input className="input" type="number" min="0" step="0.01" value={item.unit_price} onChange={(event) => patchItem(index, { unit_price: Number(event.target.value) })} /></td><td><input className="input" type="number" min="0" max="100" step="0.01" value={item.discount_percent} onChange={(event) => patchItem(index, { discount_percent: Number(event.target.value) })} /></td><td><input className="input" type="number" min="0" step="0.01" disabled={!draft.is_vat_registered} value={item.tax_rate} onChange={(event) => patchItem(index, { tax_rate: Number(event.target.value) })} /></td><td className="font-bold">THB {total.toLocaleString("th-TH", { minimumFractionDigits: 2 })}</td><td><button type="button" className="btn-secondary btn-small" onClick={() => setDraft((current) => ({ ...current, items: current.items.filter((_, itemIndex) => itemIndex !== index) }))} disabled={draft.items.length === 1}>Remove</button></td></tr>; })}</tbody></table></div>
      <button type="button" className="btn-secondary" onClick={() => setDraft((current) => ({ ...current, items: [...current.items, { ...emptyItem }] }))}>+ Add item</button>

      <div className="grid gap-5 lg:grid-cols-[1fr_360px]"><label><span className="label">Notes</span><textarea className="input textarea min-h-36" name="notes" value={draft.notes} onChange={(event) => field("notes", event.target.value)} /></label><div className="rounded-2xl bg-slate-50 p-5 space-y-2"><div className="flex justify-between"><span>Subtotal</span><b>THB {totals.subtotal.toLocaleString("th-TH", { minimumFractionDigits: 2 })}</b></div><div className="flex justify-between"><span>Discount</span><b>THB {totals.discount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}</b></div><div className="flex justify-between"><span>VAT</span><b>THB {totals.tax.toLocaleString("th-TH", { minimumFractionDigits: 2 })}</b></div><div className="flex justify-between"><span>Grand Total</span><b>THB {totals.grandTotal.toLocaleString("th-TH", { minimumFractionDigits: 2 })}</b></div><div className="flex justify-between"><span>WHT</span><b>THB {totals.withholding.toLocaleString("th-TH", { minimumFractionDigits: 2 })}</b></div><div className="mt-3 flex justify-between border-t pt-3 text-xl"><span className="font-black">Net Payable</span><b>THB {totals.netPayable.toLocaleString("th-TH", { minimumFractionDigits: 2 })}</b></div></div></div>
      <div className="action-row"><button type="button" className="btn-secondary" onClick={() => { localStorage.removeItem(draftKey); setDraft({ customer_id: "", quotation_date: today, valid_until: "", salesperson: "", project_name: "", payment_terms: "Payment within 30 days", currency_code: "THB", notes: "", is_vat_registered: taxDefaults.is_vat_registered, withholding_tax_rate: taxDefaults.default_withholding_tax_rate, installment_count: 1, items: [{ ...emptyItem }] }); setRestored(false); }}>Clear draft</button><button className="btn-primary">Save Quotation</button></div>
    </form>
  );
}