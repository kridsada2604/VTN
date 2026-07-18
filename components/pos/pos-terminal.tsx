"use client";

import Link from "next/link";
import { Minus, Plus, Search, Trash2 } from "lucide-react";
import { useMemo, useRef, useState } from "react";

type Customer = { id: string; code: string; name: string };
type Product = { id: string; sku: string; name: string; barcode: string | null; selling_price: number };
type Warehouse = { id: string; code: string; name: string };
type TaxDefaults = { is_vat_registered: boolean; default_vat_rate: number; default_withholding_tax_rate: number };
type CartItem = { product_id: string; sku: string; description: string; quantity: number; unit_price: number; line_discount: number; line_tax: number; barcode: string | null };

const money = (value: number) => value.toLocaleString("th-TH", { minimumFractionDigits: 2 });

export function PosTerminal({
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
  const barcodeRef = useRef<HTMLInputElement>(null);
  const [warehouseId, setWarehouseId] = useState(warehouses[0]?.id ?? "");
  const [customerId, setCustomerId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [paidAmount, setPaidAmount] = useState(0);
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);

  const filteredProducts = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return products.slice(0, 18);
    return products.filter((product) => `${product.sku} ${product.name} ${product.barcode ?? ""}`.toLowerCase().includes(normalized)).slice(0, 24);
  }, [products, query]);

  const totals = useMemo(
    () =>
      cart.reduce(
        (acc, item) => {
          const subtotal = item.quantity * item.unit_price;
          const lineTax = isVatRegistered ? item.line_tax : 0;
          const total = subtotal - item.line_discount + lineTax;
          return { subtotal: acc.subtotal + subtotal, discount: acc.discount + item.line_discount, tax: acc.tax + lineTax, total: acc.total + total };
        },
        { subtotal: 0, discount: 0, tax: 0, total: 0 },
      ),
    [cart, isVatRegistered],
  );

  const paid = paidAmount || totals.total;
  const change = Math.max(paid - totals.total, 0);

  const addProduct = (product: Product) => {
    setCart((current) => {
      const existing = current.find((item) => item.product_id === product.id);
      if (existing) return current.map((item) => (item.product_id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
      return [
        ...current,
        {
          product_id: product.id,
          sku: product.sku,
          description: product.name,
          quantity: 1,
          unit_price: Number(product.selling_price),
          line_discount: 0,
          line_tax: 0,
          barcode: product.barcode,
        },
      ];
    });
    setPaidAmount(0);
    setQuery("");
    barcodeRef.current?.focus();
  };

  const scan = () => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return;
    const product = products.find((entry) => entry.barcode?.toLowerCase() === normalized || entry.sku.toLowerCase() === normalized);
    if (product) addProduct(product);
  };

  const patchQuantity = (productId: string, quantity: number) => {
    setCart((current) => current.map((item) => (item.product_id === productId ? { ...item, quantity: Math.max(quantity, 1) } : item)));
    setPaidAmount(0);
  };

  const removeProduct = (productId: string) => {
    setCart((current) => current.filter((item) => item.product_id !== productId));
    setPaidAmount(0);
  };

  return (
    <form action={action} className="min-h-[calc(100vh-7rem)]">
      <input type="hidden" name="warehouse_id" value={warehouseId} />
      <input type="hidden" name="customer_id" value={customerId} />
      <input type="hidden" name="sale_date" value={today} />
      <input type="hidden" name="payment_method" value={paymentMethod} />
      <input type="hidden" name="paid_amount" value={paid.toFixed(2)} />
      <input type="hidden" name="items" value={JSON.stringify(cart.map((item) => (isVatRegistered ? item : { ...item, line_tax: 0 })))} />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-orange-600">POS TERMINAL</p>
          <h1 className="text-3xl font-black">Cashier</h1>
        </div>
        <div className="action-row">
          <Link href="/pos" className="btn-secondary">Dashboard</Link>
          <button className="btn-primary" disabled={!cart.length || !warehouseId || paid < totals.total}>Pay & Print</button>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_430px]">
        <section className="space-y-5">
          <div className="card p-4">
            <div className="grid gap-3 lg:grid-cols-[1fr_220px_220px]">
              <label>
                <span className="label">Scan / Search</span>
                <div className="flex gap-2">
                  <input ref={barcodeRef} className="input" autoFocus value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); scan(); } }} placeholder="Barcode, SKU, product name" />
                  <button type="button" className="btn-secondary" onClick={scan} aria-label="Search"><Search size={18} /></button>
                </div>
              </label>
              <label>
                <span className="label">Warehouse</span>
                <select className="input" value={warehouseId} onChange={(event) => setWarehouseId(event.target.value)}>
                  {warehouses.map((warehouse) => <option key={warehouse.id} value={warehouse.id}>{warehouse.code} - {warehouse.name}</option>)}
                </select>
              </label>
              <label>
                <span className="label">Customer</span>
                <select className="input" value={customerId} onChange={(event) => setCustomerId(event.target.value)}>
                  <option value="">Walk-in</option>
                  {customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.code} - {customer.name}</option>)}
                </select>
              </label>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProducts.map((product) => (
              <button key={product.id} type="button" className="card p-4 text-left hover:border-orange-300" onClick={() => addProduct(product)}>
                <p className="text-xs font-bold text-gray-500">{product.sku}</p>
                <p className="mt-1 min-h-12 font-black">{product.name}</p>
                <p className="mt-3 text-xl font-black text-orange-700">{money(Number(product.selling_price))}</p>
              </button>
            ))}
          </div>
        </section>

        <aside className="card flex min-h-[720px] flex-col p-4">
          <h2 className="font-black">Cart</h2>
          <div className="mt-4 flex-1 space-y-3 overflow-auto">
            {cart.map((item) => (
              <div key={item.product_id} className="rounded-xl border border-gray-200 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold text-gray-500">{item.sku}</p>
                    <p className="font-black">{item.description}</p>
                    <p className="text-sm text-gray-500">{money(item.unit_price)} x {item.quantity}</p>
                  </div>
                  <button type="button" className="btn-secondary btn-small" onClick={() => removeProduct(item.product_id)} aria-label="Remove"><Trash2 size={15} /></button>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button type="button" className="btn-secondary btn-small" onClick={() => patchQuantity(item.product_id, item.quantity - 1)} aria-label="Decrease"><Minus size={15} /></button>
                    <input className="input w-20 text-center" type="number" min="1" step="1" value={item.quantity} onChange={(event) => patchQuantity(item.product_id, Number(event.target.value))} />
                    <button type="button" className="btn-secondary btn-small" onClick={() => patchQuantity(item.product_id, item.quantity + 1)} aria-label="Increase"><Plus size={15} /></button>
                  </div>
                  <p className="text-lg font-black">{money(item.quantity * item.unit_price - item.line_discount + item.line_tax)}</p>
                </div>
              </div>
            ))}
            {!cart.length && <div className="rounded-xl border border-dashed p-8 text-center text-gray-500">Scan or select products to start a sale.</div>}
          </div>

          <div className="mt-4 space-y-3 border-t pt-4">
            <div className="flex justify-between"><span>Subtotal</span><b>{money(totals.subtotal)}</b></div>
            <div className="flex justify-between"><span>Discount</span><b>{money(totals.discount)}</b></div>
            {isVatRegistered && <div className="flex justify-between"><span>Tax</span><b>{money(totals.tax)}</b></div>}
            <div className="flex justify-between text-3xl"><span className="font-black">Total</span><b>{money(totals.total)}</b></div>
            <div className="grid gap-2 sm:grid-cols-2">
              {["CASH", "QR", "CARD", "TRANSFER"].map((method) => (
                <button key={method} type="button" className={paymentMethod === method ? "btn-primary" : "btn-secondary"} onClick={() => setPaymentMethod(method)}>{method}</button>
              ))}
            </div>
            <label>
              <span className="label">Paid</span>
              <input className="input text-2xl font-black" type="number" min={totals.total} step="0.01" value={paidAmount || totals.total} onChange={(event) => setPaidAmount(Number(event.target.value))} />
            </label>
            <div className="flex justify-between rounded-xl bg-gray-50 p-4 text-xl"><span className="font-bold">Change</span><b>{money(change)}</b></div>
            <button className="btn-primary w-full text-lg" disabled={!cart.length || !warehouseId || paid < totals.total}>Pay & Print</button>
          </div>
        </aside>
      </div>
    </form>
  );
}
