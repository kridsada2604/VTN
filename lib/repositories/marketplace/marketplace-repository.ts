import type { createClient } from "@/lib/supabase/server";
import type {
  ConvertMarketplaceOrderInput,
  CreateMarketplaceChannelInput,
  CreateMarketplaceFeeInput,
  ImportMarketplaceOrderInput,
  MapMarketplaceSkuInput,
  TriggerMarketplaceSyncInput,
} from "@/lib/validation/marketplace/marketplace";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export type MarketplaceChannelRow = {
  id: string;
  name: string;
  platform: string;
  shop_code: string;
  status: string;
  sync_status: string;
  last_synced_at: string | null;
};

export type MarketplaceOrderRow = {
  id: string;
  order_no: string;
  external_order_no: string;
  order_date: string;
  status: string;
  payment_status: string;
  fulfillment_status: string;
  buyer_name: string;
  total_amount: number | string;
  marketplace_channels: { name: string; platform: string }[] | null;
};

export type MarketplaceOrderDetail = MarketplaceOrderRow & {
  buyer_phone: string | null;
  shipping_address: string | null;
  subtotal: number | string;
  discount_amount: number | string;
  shipping_fee: number | string;
  tax_amount: number | string;
  sales_order_id: string | null;
  sales_delivery_id: string | null;
};

export type MarketplaceOrderItemRow = {
  id: string;
  marketplace_sku: string;
  description: string;
  quantity: number | string;
  unit_price: number | string;
  line_discount: number | string;
  line_total: number | string;
  mapping_status: string;
  products: { sku: string; name: string }[] | null;
};

export type MarketplaceFeeRow = {
  id: string;
  fee_type: string;
  amount: number | string;
  notes: string | null;
  created_at: string;
};

export type UnmappedMarketplaceSkuRow = {
  channel_id: string;
  channel_name: string;
  platform: string;
  marketplace_sku: string;
  marketplace_product_name: string;
  order_count: number;
  quantity: number;
  latest_order_no: string;
};

export type MarketplaceSyncLogRow = {
  id: string;
  channel_id: string;
  trigger_source: string;
  status: string;
  orders_imported: number | string;
  error_message: string | null;
  started_at: string;
  finished_at: string | null;
  marketplace_channels: { name: string; platform: string }[] | null;
};

type RawUnmappedMarketplaceItem = {
  id: string;
  marketplace_sku: string;
  description: string;
  quantity: number | string;
  marketplace_orders:
    | {
        channel_id: string;
        order_no: string;
        external_order_no: string;
        marketplace_channels: { name: string; platform: string }[] | null;
      }[]
    | null;
};

export class MarketplaceRepository {
  constructor(private readonly supabase: SupabaseServerClient) {}

  async dashboard(companyId: string) {
    const [channels, orders, syncLogs] = await Promise.all([
      this.supabase
        .from("marketplace_channels")
        .select("id,name,platform,shop_code,status,sync_status,last_synced_at")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false }),
      this.supabase
        .from("marketplace_orders")
        .select("id,order_no,external_order_no,order_date,status,payment_status,fulfillment_status,buyer_name,total_amount,marketplace_channels(name,platform)")
        .eq("company_id", companyId)
        .order("order_date", { ascending: false }),
      this.supabase
        .from("marketplace_sync_logs")
        .select("id,channel_id,trigger_source,status,orders_imported,error_message,started_at,finished_at,marketplace_channels(name,platform)")
        .eq("company_id", companyId)
        .order("started_at", { ascending: false })
        .limit(10),
    ]);

    if (channels.error) throw channels.error;
    if (orders.error) throw orders.error;
    if (syncLogs.error) throw syncLogs.error;

    return {
      channels: (channels.data ?? []) as MarketplaceChannelRow[],
      orders: (orders.data ?? []) as MarketplaceOrderRow[],
      syncLogs: (syncLogs.data ?? []) as MarketplaceSyncLogRow[],
    };
  }

  async getFormOptions(companyId: string) {
    const [channels, products] = await Promise.all([
      this.supabase
        .from("marketplace_channels")
        .select("id,name,platform,shop_code")
        .eq("company_id", companyId)
        .eq("status", "ACTIVE")
        .order("name"),
      this.supabase
        .from("products")
        .select("id,sku,name,selling_price")
        .eq("company_id", companyId)
        .eq("is_active", true)
        .order("name"),
    ]);

    if (channels.error) throw channels.error;
    if (products.error) throw products.error;

    return {
      channels: channels.data ?? [],
      products: (products.data ?? []).map((product) => ({ ...product, selling_price: Number(product.selling_price) })),
    };
  }

  async getOrderById(companyId: string, orderId: string) {
    const [order, items, fees, events, warehouses] = await Promise.all([
      this.supabase
        .from("marketplace_orders")
        .select("*,marketplace_channels(name,platform)")
        .eq("id", orderId)
        .eq("company_id", companyId)
        .maybeSingle(),
      this.supabase
        .from("marketplace_order_items")
        .select("id,marketplace_sku,description,quantity,unit_price,line_discount,line_total,mapping_status,products(sku,name)")
        .eq("order_id", orderId)
        .order("sort_order"),
      this.supabase
        .from("marketplace_fee_reconciliations")
        .select("id,fee_type,amount,notes,created_at")
        .eq("company_id", companyId)
        .eq("order_id", orderId)
        .order("created_at", { ascending: false }),
      this.supabase
        .from("marketplace_order_events")
        .select("id,event_type,message,created_at")
        .eq("order_id", orderId)
        .order("created_at", { ascending: false }),
      this.supabase
        .from("warehouses")
        .select("id,code,name")
        .eq("company_id", companyId)
        .eq("is_active", true)
        .order("code"),
    ]);

    if (order.error) throw order.error;
    if (items.error) throw items.error;
    if (fees.error) throw fees.error;
    if (events.error) throw events.error;
    if (warehouses.error) throw warehouses.error;

    return {
      order: order.data as MarketplaceOrderDetail | null,
      items: (items.data ?? []) as MarketplaceOrderItemRow[],
      fees: (fees.data ?? []) as MarketplaceFeeRow[],
      events: events.data ?? [],
      warehouses: warehouses.data ?? [],
    };
  }

  async getUnmappedSkuManagement(companyId: string) {
    const [items, products] = await Promise.all([
      this.supabase
        .from("marketplace_order_items")
        .select("id,marketplace_sku,description,quantity,marketplace_orders!inner(channel_id,order_no,external_order_no,company_id,marketplace_channels(name,platform))")
        .eq("mapping_status", "UNMAPPED")
        .eq("marketplace_orders.company_id", companyId)
        .order("marketplace_sku"),
      this.supabase.from("products").select("id,sku,name").eq("company_id", companyId).eq("is_active", true).order("name"),
    ]);

    if (items.error) throw items.error;
    if (products.error) throw products.error;

    const grouped = new Map<string, UnmappedMarketplaceSkuRow>();
    for (const item of (items.data ?? []) as RawUnmappedMarketplaceItem[]) {
      const order = item.marketplace_orders?.[0];
      if (!order) continue;
      const channel = order.marketplace_channels?.[0];
      const key = `${order.channel_id}:${item.marketplace_sku}`;
      const existing = grouped.get(key);

      if (existing) {
        existing.order_count += 1;
        existing.quantity += Number(item.quantity);
        continue;
      }

      grouped.set(key, {
        channel_id: order.channel_id,
        channel_name: channel?.name ?? "-",
        platform: channel?.platform ?? "-",
        marketplace_sku: item.marketplace_sku,
        marketplace_product_name: item.description,
        order_count: 1,
        quantity: Number(item.quantity),
        latest_order_no: order.order_no,
      });
    }

    return {
      unmapped: Array.from(grouped.values()).sort((a, b) => a.marketplace_sku.localeCompare(b.marketplace_sku)),
      products: products.data ?? [],
    };
  }

  async createChannel(companyId: string, input: CreateMarketplaceChannelInput) {
    const { data, error } = await this.supabase.rpc("create_marketplace_channel", {
      p_company_id: companyId,
      p_name: input.name,
      p_platform: input.platform,
      p_shop_code: input.shop_code,
    });

    if (error) throw error;
    return data as string;
  }

  async importOrder(companyId: string, input: ImportMarketplaceOrderInput) {
    const items = input.items.map((item, index) => ({ ...item, sort_order: index + 1 }));
    const { data, error } = await this.supabase.rpc("import_marketplace_order", {
      p_company_id: companyId,
      p_channel_id: input.channel_id,
      p_external_order_no: input.external_order_no,
      p_order_date: input.order_date,
      p_buyer_name: input.buyer_name,
      p_buyer_phone: input.buyer_phone,
      p_shipping_address: input.shipping_address,
      p_shipping_fee: input.shipping_fee,
      p_discount_amount: input.discount_amount,
      p_tax_amount: input.tax_amount,
      p_raw_payload: {},
      p_items: items,
    });

    if (error) throw error;
    return data as string;
  }

  async mapSku(companyId: string, input: MapMarketplaceSkuInput) {
    const { data, error } = await this.supabase.rpc("map_marketplace_sku", {
      p_company_id: companyId,
      p_channel_id: input.channel_id,
      p_marketplace_sku: input.marketplace_sku,
      p_marketplace_product_name: input.marketplace_product_name,
      p_product_id: input.product_id,
    });

    if (error) throw error;
    return Number(data ?? 0);
  }

  async createFee(companyId: string, input: CreateMarketplaceFeeInput) {
    const { data, error } = await this.supabase.rpc("create_marketplace_fee_reconciliation", {
      p_company_id: companyId,
      p_order_id: input.order_id,
      p_fee_type: input.fee_type,
      p_amount: input.amount,
      p_notes: input.notes,
    });

    if (error) throw error;
    return String(data);
  }

  async convertOrder(companyId: string, input: ConvertMarketplaceOrderInput) {
    const { data, error } = await this.supabase.rpc("convert_marketplace_order_to_sales", {
      p_company_id: companyId,
      p_marketplace_order_id: input.order_id,
      p_warehouse_id: input.warehouse_id,
      p_auto_deliver: input.auto_deliver,
      p_notes: input.notes,
    });

    if (error) throw error;
    return data as { sales_order_id?: string; sales_delivery_id?: string | null };
  }

  async triggerSync(companyId: string, input: TriggerMarketplaceSyncInput) {
    const { error } = await this.supabase.functions.invoke("marketplace-sync", {
      body: {
        channel_id: input.channel_id,
        trigger_source: input.trigger_source,
      },
    });

    if (!error) return input.channel_id;

    const { data: syncLogId, error: startError } = await this.supabase.rpc("start_marketplace_sync", {
      p_company_id: companyId,
      p_channel_id: input.channel_id,
      p_trigger_source: input.trigger_source,
    });

    if (startError) throw startError;

    const { error: finishError } = await this.supabase.rpc("finish_marketplace_sync", {
      p_company_id: companyId,
      p_sync_log_id: syncLogId,
      p_status: "FAILED",
      p_orders_imported: 0,
      p_error_message: error.message,
    });

    if (finishError) throw finishError;
    return input.channel_id;
  }
}
