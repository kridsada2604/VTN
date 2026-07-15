export type CreateMarketplaceChannelInput = {
  name: string;
  platform: string;
  shop_code: string;
};

export type MarketplaceOrderItemInput = {
  product_id: string | null;
  marketplace_sku: string;
  description: string;
  quantity: number;
  unit_price: number;
  line_discount: number;
};

export type ImportMarketplaceOrderInput = {
  channel_id: string;
  external_order_no: string;
  order_date: string;
  buyer_name: string;
  buyer_phone: string | null;
  shipping_address: string | null;
  shipping_fee: number;
  discount_amount: number;
  tax_amount: number;
  items: MarketplaceOrderItemInput[];
};

const text = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();

const numberOrZero = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export function parseMarketplaceChannelForm(fd: FormData): CreateMarketplaceChannelInput {
  const input = {
    name: text(fd, "name"),
    platform: text(fd, "platform"),
    shop_code: text(fd, "shop_code"),
  };

  if (!input.name) throw new Error("กรุณาระบุชื่อร้าน");
  if (!input.platform) throw new Error("กรุณาเลือกแพลตฟอร์ม");
  if (!input.shop_code) throw new Error("กรุณาระบุรหัสร้าน");

  return input;
}

export function parseMarketplaceOrderForm(fd: FormData): ImportMarketplaceOrderInput {
  let items: MarketplaceOrderItemInput[] = [];

  try {
    const parsed = JSON.parse(text(fd, "items") || "[]") as Array<Partial<MarketplaceOrderItemInput>>;
    items = parsed.map((item) => ({
      product_id: item.product_id ? String(item.product_id) : null,
      marketplace_sku: String(item.marketplace_sku ?? "").trim(),
      description: String(item.description ?? "").trim(),
      quantity: numberOrZero(item.quantity),
      unit_price: numberOrZero(item.unit_price),
      line_discount: numberOrZero(item.line_discount),
    }));
  } catch {
    throw new Error("รายการสินค้า Marketplace ไม่ถูกต้อง");
  }

  const input: ImportMarketplaceOrderInput = {
    channel_id: text(fd, "channel_id"),
    external_order_no: text(fd, "external_order_no"),
    order_date: text(fd, "order_date"),
    buyer_name: text(fd, "buyer_name"),
    buyer_phone: text(fd, "buyer_phone") || null,
    shipping_address: text(fd, "shipping_address") || null,
    shipping_fee: numberOrZero(fd.get("shipping_fee")),
    discount_amount: numberOrZero(fd.get("discount_amount")),
    tax_amount: numberOrZero(fd.get("tax_amount")),
    items,
  };

  if (!input.channel_id) throw new Error("กรุณาเลือกช่องทาง Marketplace");
  if (!input.external_order_no) throw new Error("กรุณาระบุเลขออเดอร์จาก Marketplace");
  if (!input.order_date) throw new Error("กรุณาระบุวันที่ออเดอร์");
  if (!input.buyer_name) throw new Error("กรุณาระบุชื่อลูกค้า");
  if (!input.items.length) throw new Error("กรุณาเพิ่มรายการสินค้าอย่างน้อย 1 รายการ");
  if (input.items.some((item) => !item.marketplace_sku || !item.description || item.quantity <= 0 || item.unit_price < 0 || item.line_discount < 0)) {
    throw new Error("กรุณาตรวจสอบ SKU รายละเอียด จำนวน ราคา และส่วนลด");
  }

  return input;
}
