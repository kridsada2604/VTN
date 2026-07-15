export type PosSaleItemInput = {
  product_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  line_discount: number;
  line_tax: number;
  barcode: string | null;
};

export type CreatePosSaleInput = {
  warehouse_id: string;
  customer_id: string | null;
  sale_date: string;
  payment_method: string;
  paid_amount: number;
  notes: string | null;
  items: PosSaleItemInput[];
};

const text = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();

const numberOrZero = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export function parsePosSaleForm(fd: FormData): CreatePosSaleInput {
  let items: PosSaleItemInput[] = [];

  try {
    const parsed = JSON.parse(text(fd, "items") || "[]") as Array<Partial<PosSaleItemInput>>;
    items = parsed.map((item) => ({
      product_id: String(item.product_id ?? "").trim(),
      description: String(item.description ?? "").trim(),
      quantity: numberOrZero(item.quantity),
      unit_price: numberOrZero(item.unit_price),
      line_discount: numberOrZero(item.line_discount),
      line_tax: numberOrZero(item.line_tax),
      barcode: item.barcode ? String(item.barcode).trim() : null,
    }));
  } catch {
    throw new Error("รายการขาย POS ไม่ถูกต้อง");
  }

  const input: CreatePosSaleInput = {
    warehouse_id: text(fd, "warehouse_id"),
    customer_id: text(fd, "customer_id") || null,
    sale_date: text(fd, "sale_date"),
    payment_method: text(fd, "payment_method") || "CASH",
    paid_amount: numberOrZero(fd.get("paid_amount")),
    notes: text(fd, "notes") || null,
    items,
  };

  if (!input.warehouse_id) throw new Error("กรุณาเลือกคลังสินค้า");
  if (!input.sale_date) throw new Error("กรุณาระบุวันที่ขาย");
  if (!input.items.length) throw new Error("กรุณาเพิ่มรายการขายอย่างน้อย 1 รายการ");
  if (input.items.some((item) => !item.product_id || item.quantity <= 0 || item.unit_price < 0 || item.line_discount < 0 || item.line_tax < 0)) {
    throw new Error("กรุณาตรวจสอบสินค้า จำนวน ราคา ส่วนลด และภาษี");
  }

  return input;
}
