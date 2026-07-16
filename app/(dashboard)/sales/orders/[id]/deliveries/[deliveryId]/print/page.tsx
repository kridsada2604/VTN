import Link from "next/link";
import { notFound } from "next/navigation";
import { getSalesDeliveryPrint } from "@/lib/services/sales/sales-order-service";
import { PrintButton } from "./print-button";

const number = (value: number | string) => Number(value).toLocaleString("th-TH", { minimumFractionDigits: 2 });

export default async function Page({ params }: { params: Promise<{ id: string; deliveryId: string }> }) {
  const { id, deliveryId } = await params;
  const { company, delivery, items } = await getSalesDeliveryPrint(deliveryId);
  if (!delivery) notFound();

  const order = delivery.sales_orders?.[0];
  const customer = order?.customers?.[0];
  const warehouse = order?.warehouses?.[0];

  return (
    <div className="mx-auto max-w-5xl bg-white p-6 text-slate-900 print:p-0">
      <div className="mb-4 flex flex-wrap gap-2 print:hidden">
        <Link className="btn-secondary" href={`/sales/orders/${id}`}>Back</Link>
        <PrintButton />
      </div>

      <div className="rounded-lg border border-slate-200 p-8 print:rounded-none print:border-0">
        <header className="flex items-start justify-between gap-8 border-b pb-6">
          <div>
            <h1 className="text-2xl font-black">{company?.name_th ?? "Company"}</h1>
            {company?.name_en && <p className="font-bold text-slate-600">{company.name_en}</p>}
            <p className="mt-3 max-w-xl text-sm text-slate-600">{company?.address ?? "-"}</p>
            <p className="text-sm text-slate-600">Tax ID: {company?.tax_id ?? "-"} / Tel: {company?.phone ?? "-"}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-slate-500">DELIVERY NOTE</p>
            <p className="mt-2 text-2xl font-black">{delivery.document_no}</p>
            <p className="text-sm text-slate-600">Date: {delivery.delivery_date}</p>
            <p className="text-sm text-slate-600">Status: {delivery.status}</p>
          </div>
        </header>

        <section className="grid gap-6 border-b py-6 md:grid-cols-2">
          <div>
            <p className="text-xs font-bold uppercase text-slate-500">Deliver To</p>
            <p className="mt-2 text-lg font-black">{customer?.name ?? "-"}</p>
            <p className="text-sm text-slate-600">Code: {customer?.code ?? "-"}</p>
            <p className="text-sm text-slate-600">Tax ID: {customer?.tax_id ?? "-"}</p>
            <p className="mt-2 text-sm text-slate-600">{customer?.address ?? "-"}</p>
            <p className="text-sm text-slate-600">Tel: {customer?.phone ?? "-"} / Email: {customer?.email ?? "-"}</p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase text-slate-500">Reference</p>
            <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
              <span className="text-slate-500">Sales Order</span><b>{order?.document_no ?? "-"}</b>
              <span className="text-slate-500">Order Date</span><b>{order?.order_date ?? "-"}</b>
              <span className="text-slate-500">Requested Date</span><b>{order?.requested_delivery_date ?? "-"}</b>
              <span className="text-slate-500">Warehouse</span><b>{warehouse ? `${warehouse.code} - ${warehouse.name}` : "-"}</b>
            </div>
          </div>
        </section>

        <table className="mt-6 w-full border-collapse text-sm">
          <thead>
            <tr className="border-b bg-slate-50 text-left">
              <th className="p-3">No.</th>
              <th className="p-3">SKU</th>
              <th className="p-3">Product</th>
              <th className="p-3">Description</th>
              <th className="p-3 text-right">Qty</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={item.id} className="border-b">
                <td className="p-3">{index + 1}</td>
                <td className="p-3">{item.products?.[0]?.sku ?? "-"}</td>
                <td className="p-3">{item.products?.[0]?.name ?? "-"}</td>
                <td className="p-3">{item.sales_order_items?.[0]?.description ?? "-"}</td>
                <td className="p-3 text-right font-bold">{number(item.quantity)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <section className="mt-8 grid gap-6 md:grid-cols-3">
          <div className="min-h-28 rounded border p-4">
            <p className="text-xs font-bold uppercase text-slate-500">Notes</p>
            <p className="mt-2 text-sm">{delivery.notes ?? "-"}</p>
          </div>
          <div className="min-h-28 rounded border p-4 text-center">
            <p className="text-xs font-bold uppercase text-slate-500">Delivered By</p>
            <div className="mt-14 border-t pt-2 text-sm">Signature</div>
          </div>
          <div className="min-h-28 rounded border p-4 text-center">
            <p className="text-xs font-bold uppercase text-slate-500">Received By</p>
            <div className="mt-14 border-t pt-2 text-sm">Signature / Date</div>
          </div>
        </section>
      </div>
    </div>
  );
}
