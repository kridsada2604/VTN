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

export type MapMarketplaceSkuInput = {
  channel_id: string;
  marketplace_sku: string;
  marketplace_product_name: string | null;
  product_id: string;
};

export type CreateMarketplaceFeeInput = {
  order_id: string;
  fee_type: string;
  amount: number;
  notes: string | null;
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

export function parseMarketplaceSkuMappingForm(fd: FormData): MapMarketplaceSkuInput {
  const input: MapMarketplaceSkuInput = {
    channel_id: text(fd, "channel_id"),
    marketplace_sku: text(fd, "marketplace_sku"),
    marketplace_product_name: text(fd, "marketplace_product_name") || null,
    product_id: text(fd, "product_id"),
  };

  if (!input.channel_id) throw new Error("Marketplace channel is required");
  if (!input.marketplace_sku) throw new Error("Marketplace SKU is required");
  if (!input.product_id) throw new Error("Product is required");

  return input;
}

export function parseMarketplaceFeeForm(fd: FormData): CreateMarketplaceFeeInput {
  const input: CreateMarketplaceFeeInput = {
    order_id: text(fd, "order_id"),
    fee_type: text(fd, "fee_type") || "COMMISSION",
    amount: numberOrZero(fd.get("amount")),
    notes: text(fd, "notes") || null,
  };

  if (!input.order_id) throw new Error("Marketplace order is required");
  if (!["COMMISSION", "PAYMENT", "SHIPPING", "VOUCHER", "SERVICE", "OTHER"].includes(input.fee_type)) throw new Error("Invalid marketplace fee type");
  if (input.amount <= 0) throw new Error("Marketplace fee amount must be greater than zero");

  return input;
}
