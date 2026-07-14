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
