"use client";

import { useState } from "react";

type Warehouse = { id: string; code: string; name: string };
type Item = {
  id: string;
  product_id?: string | null;
  description: string;
  quantity: number | string;
  quantity_received?: number | string;
  unit_cost: number | string;
};
type ReceiveItem = {
  purchase_order_item_id: string;
  product_id: string;
  quantity: number;
  unit_cost: number;
  lot_no: string;
  serial_no: string;
  barcode: string;
};

export function PurchaseReceiveForm({
  purchaseOrderId,
  warehouses,
  items,
  action,
}: {
  purchaseOrderId: string;
  warehouses: Warehouse[];
  items: Item[];
  action: (fd: FormData) => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const receivableItems = items.filter((item) => item.product_id && Number(item.quantity) > Number(item.quantity_received ?? 0));
  const [receiveItems, setReceiveItems] = useState<ReceiveItem[]>(
    receivableItems.map((item) => ({
      purchase_order_item_id: item.id,
      product_id: String(item.product_id),
      quantity: Number(item.quantity) - Number(item.quantity_received ?? 0),
      unit_cost: Number(item.unit_cost),
      lot_no: "",
      serial_no: "",
      barcode: "",
    })),
  );

  const patchItem = (index: number, patch: Partial<ReceiveItem>) => {
    setReceiveItems((current) => current.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)));
  };

  return (
    <form action={action} className="card p-5 space-y-5">
      <input type="hidden" name="purchase_order_id" value={purchaseOrderId} />
      <input type="hidden" name="items" value={JSON.stringify(receiveItems)} />
      <div className="form-grid">
        <label>
          <span className="label">คลังรับสินค้า *</span>
          <select className="input" name="warehouse_id" required defaultValue={warehouses[0]?.id ?? ""}>
            {warehouses.map((warehouse) => (
              <option key={warehouse.id} value={warehouse.id}>
                {warehouse.code} - {warehouse.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="label">วันที่รับสินค้า *</span>
          <input className="input" type="date" name="receipt_date" required defaultValue={today} />
        </label>
        <label className="full">
          <span className="label">หมายเหตุ</span>
          <input className="input" name="notes" />
        </label>
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>รายการ</th>
              <th>สั่งซื้อ</th>
              <th>รับแล้ว</th>
              <th>รับครั้งนี้</th>
              <th>Lot</th>
              <th>Serial</th>
              <th>Barcode</th>
            </tr>
          </thead>
          <tbody>
            {receivableItems.map((item, index) => (
              <tr key={item.id}>
                <td className="font-bold">{item.description}</td>
                <td>{Number(item.quantity).toLocaleString("th-TH")}</td>
                <td>{Number(item.quantity_received ?? 0).toLocaleString("th-TH")}</td>
                <td>
                  <input className="input" type="number" min="0" max={Number(item.quantity) - Number(item.quantity_received ?? 0)} step="0.0001" value={receiveItems[index]?.quantity ?? 0} onChange={(event) => patchItem(index, { quantity: Number(event.target.value) })} />
                </td>
                <td><input className="input" value={receiveItems[index]?.lot_no ?? ""} onChange={(event) => patchItem(index, { lot_no: event.target.value })} /></td>
                <td><input className="input" value={receiveItems[index]?.serial_no ?? ""} onChange={(event) => patchItem(index, { serial_no: event.target.value })} /></td>
                <td><input className="input" value={receiveItems[index]?.barcode ?? ""} onChange={(event) => patchItem(index, { barcode: event.target.value })} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        {!receivableItems.length && <p className="p-6 text-gray-500">ไม่มีรายการที่รับได้ หรือ PO นี้รับครบแล้ว</p>}
      </div>

      <button className="btn-primary" disabled={!receivableItems.length}>บันทึกรับสินค้า</button>
    </form>
  );
}
