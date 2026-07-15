export type SalesOrderItemInput = {
  product_id: string | null;
  description: string;
  quantity: number;
  unit_price: number;
  discount_percent: number;
  tax_rate: number;
};

export type CreateSalesOrderInput = {
  customer_id: string;
  warehouse_id: string | null;
  order_date: string;
  requested_delivery_date: string | null;
  payment_terms: string | null;
  currency_code: string;
  notes: string | null;
  items: SalesOrderItemInput[];
};

export type ReserveSalesOrderInput = {
  sales_order_id: string;
  warehouse_id: string;
};

export type DeliverSalesOrderInput = {
  sales_order_id: string;
  delivery_date: string;
  notes: string | null;
};

export type InvoiceSalesOrderInput = {
  sales_order_id: string;
  invoice_date: string;
  due_date: string | null;
  notes: string | null;
};

const text = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();

const numberOrZero = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export function parseSalesOrderForm(fd: FormData): CreateSalesOrderInput {
  let items: SalesOrderItemInput[] = [];

  try {
    const parsed = JSON.parse(text(fd, "items") || "[]") as Array<Partial<SalesOrderItemInput>>;
    items = parsed.map((item) => ({
      product_id: item.product_id ? String(item.product_id) : null,
      description: String(item.description ?? "").trim(),
      quantity: numberOrZero(item.quantity),
      unit_price: numberOrZero(item.unit_price),
      discount_percent: numberOrZero(item.discount_percent),
      tax_rate: numberOrZero(item.tax_rate),
    }));
  } catch {
    throw new Error("รายการสินค้า Sales Order ไม่ถูกต้อง");
  }

  const input: CreateSalesOrderInput = {
    customer_id: text(fd, "customer_id"),
    warehouse_id: text(fd, "warehouse_id") || null,
    order_date: text(fd, "order_date"),
    requested_delivery_date: text(fd, "requested_delivery_date") || null,
    payment_terms: text(fd, "payment_terms") || null,
    currency_code: text(fd, "currency_code") || "THB",
    notes: text(fd, "notes") || null,
    items,
  };

  if (!input.customer_id) throw new Error("กรุณาเลือกลูกค้า");
  if (!input.order_date) throw new Error("กรุณาระบุวันที่ Sales Order");
  if (!input.items.length) throw new Error("กรุณาเพิ่มรายการสินค้าอย่างน้อย 1 รายการ");
  if (input.items.some((item) => !item.description || item.quantity <= 0 || item.unit_price < 0 || item.discount_percent < 0 || item.tax_rate < 0)) {
    throw new Error("กรุณาตรวจสอบรายละเอียด จำนวน ราคา ส่วนลด และภาษี");
  }

  return input;
}

export function parseReserveSalesOrderForm(fd: FormData): ReserveSalesOrderInput {
  const input = {
    sales_order_id: text(fd, "sales_order_id"),
    warehouse_id: text(fd, "warehouse_id"),
  };

  if (!input.sales_order_id) throw new Error("ไม่พบ Sales Order");
  if (!input.warehouse_id) throw new Error("กรุณาเลือกคลังสินค้า");
  return input;
}

export function parseDeliverSalesOrderForm(fd: FormData): DeliverSalesOrderInput {
  const input = {
    sales_order_id: text(fd, "sales_order_id"),
    delivery_date: text(fd, "delivery_date"),
    notes: text(fd, "notes") || null,
  };

  if (!input.sales_order_id) throw new Error("ไม่พบ Sales Order");
  if (!input.delivery_date) throw new Error("กรุณาระบุวันที่ส่งของ");
  return input;
}

export function parseInvoiceSalesOrderForm(fd: FormData): InvoiceSalesOrderInput {
  const input = {
    sales_order_id: text(fd, "sales_order_id"),
    invoice_date: text(fd, "invoice_date"),
    due_date: text(fd, "due_date") || null,
    notes: text(fd, "notes") || null,
  };

  if (!input.sales_order_id) throw new Error("ไม่พบ Sales Order");
  if (!input.invoice_date) throw new Error("กรุณาระบุวันที่ใบแจ้งหนี้");
  return input;
}
