export type StockMovementItemInput = {
  product_id: string;
  quantity: number;
  unit_cost: number;
  lot_no: string | null;
  serial_no: string | null;
  barcode: string | null;
};

export type CreateStockMovementInput = {
  warehouse_id: string;
  movement_date: string;
  movement_type: string;
  notes: string | null;
  items: StockMovementItemInput[];
};

const text = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();

const numberOrZero = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export function parseStockMovementForm(fd: FormData): CreateStockMovementInput {
  let items: StockMovementItemInput[] = [];

  try {
    const parsed = JSON.parse(text(fd, "items") || "[]") as Array<Partial<StockMovementItemInput>>;
    items = parsed.map((item) => ({
      product_id: String(item.product_id ?? "").trim(),
      quantity: numberOrZero(item.quantity),
      unit_cost: numberOrZero(item.unit_cost),
      lot_no: item.lot_no ? String(item.lot_no).trim() : null,
      serial_no: item.serial_no ? String(item.serial_no).trim() : null,
      barcode: item.barcode ? String(item.barcode).trim() : null,
    }));
  } catch {
    throw new Error("รายการเคลื่อนไหวสต๊อกไม่ถูกต้อง");
  }

  const input: CreateStockMovementInput = {
    warehouse_id: text(fd, "warehouse_id"),
    movement_date: text(fd, "movement_date"),
    movement_type: text(fd, "movement_type"),
    notes: text(fd, "notes") || null,
    items,
  };

  if (!input.warehouse_id) throw new Error("กรุณาเลือกคลังสินค้า");
  if (!input.movement_date) throw new Error("กรุณาระบุวันที่เอกสาร");
  if (!input.movement_type) throw new Error("กรุณาเลือกประเภทการเคลื่อนไหว");
  if (!input.items.length) throw new Error("กรุณาเพิ่มสินค้าอย่างน้อย 1 รายการ");
  if (input.items.some((item) => !item.product_id || item.quantity <= 0 || item.unit_cost < 0)) {
    throw new Error("กรุณาตรวจสอบสินค้า จำนวน และต้นทุน");
  }

  return input;
}
