export type PurchaseOrderItemInput = {
  product_id: string | null;
  description: string;
  quantity: number;
  unit_cost: number;
  discount_percent: number;
  tax_rate: number;
};

export type CreatePurchaseOrderInput = {
  supplier_id: string;
  order_date: string;
  expected_date: string | null;
  currency_code: string;
  notes: string | null;
  items: PurchaseOrderItemInput[];
};

export type PurchaseReceiveItemInput = {
  purchase_order_item_id: string;
  product_id: string;
  quantity: number;
  unit_cost: number;
  lot_no: string | null;
  serial_no: string | null;
  barcode: string | null;
};

export type ReceivePurchaseOrderInput = {
  purchase_order_id: string;
  warehouse_id: string;
  receipt_date: string;
  notes: string | null;
  items: PurchaseReceiveItemInput[];
};

const text = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();

const numberOrZero = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export function parsePurchaseOrderForm(fd: FormData): CreatePurchaseOrderInput {
  let items: PurchaseOrderItemInput[] = [];

  try {
    const parsed = JSON.parse(text(fd, "items") || "[]") as Array<Partial<PurchaseOrderItemInput>>;
    items = parsed.map((item) => ({
      product_id: item.product_id ? String(item.product_id) : null,
      description: String(item.description ?? "").trim(),
      quantity: numberOrZero(item.quantity),
      unit_cost: numberOrZero(item.unit_cost),
      discount_percent: numberOrZero(item.discount_percent),
      tax_rate: numberOrZero(item.tax_rate),
    }));
  } catch {
    throw new Error("รายการสินค้าไม่ถูกต้อง");
  }

  const input: CreatePurchaseOrderInput = {
    supplier_id: text(fd, "supplier_id"),
    order_date: text(fd, "order_date"),
    expected_date: text(fd, "expected_date") || null,
    currency_code: text(fd, "currency_code") || "THB",
    notes: text(fd, "notes") || null,
    items,
  };

  if (!input.supplier_id) throw new Error("กรุณาเลือก Supplier");
  if (!input.order_date) throw new Error("กรุณาระบุวันที่ใบสั่งซื้อ");
  if (!input.items.length) throw new Error("กรุณาเพิ่มรายการสินค้าอย่างน้อย 1 รายการ");
  if (input.items.some((item) => !item.description || item.quantity <= 0 || item.unit_cost < 0)) {
    throw new Error("กรุณาตรวจสอบรายละเอียด จำนวน และต้นทุนสินค้า");
  }

  return input;
}

export function parseReceivePurchaseOrderForm(fd: FormData): ReceivePurchaseOrderInput {
  let items: PurchaseReceiveItemInput[] = [];

  try {
    const parsed = JSON.parse(text(fd, "items") || "[]") as Array<Partial<PurchaseReceiveItemInput>>;
    items = parsed
      .map((item) => ({
        purchase_order_item_id: String(item.purchase_order_item_id ?? "").trim(),
        product_id: String(item.product_id ?? "").trim(),
        quantity: numberOrZero(item.quantity),
        unit_cost: numberOrZero(item.unit_cost),
        lot_no: item.lot_no ? String(item.lot_no).trim() : null,
        serial_no: item.serial_no ? String(item.serial_no).trim() : null,
        barcode: item.barcode ? String(item.barcode).trim() : null,
      }))
      .filter((item) => item.quantity > 0);
  } catch {
    throw new Error("รายการรับสินค้าไม่ถูกต้อง");
  }

  const input: ReceivePurchaseOrderInput = {
    purchase_order_id: text(fd, "purchase_order_id"),
    warehouse_id: text(fd, "warehouse_id"),
    receipt_date: text(fd, "receipt_date"),
    notes: text(fd, "notes") || null,
    items,
  };

  if (!input.purchase_order_id) throw new Error("ไม่พบใบสั่งซื้อ");
  if (!input.warehouse_id) throw new Error("กรุณาเลือกคลังสินค้า");
  if (!input.receipt_date) throw new Error("กรุณาระบุวันที่รับสินค้า");
  if (!input.items.length) throw new Error("กรุณาระบุจำนวนรับอย่างน้อย 1 รายการ");
  if (input.items.some((item) => !item.purchase_order_item_id || !item.product_id || item.unit_cost < 0)) {
    throw new Error("กรุณาตรวจสอบรายการรับสินค้า");
  }

  return input;
}
