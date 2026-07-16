import type { createClient } from "@/lib/supabase/server";
import type { SalesOrderComputedItem } from "@/lib/services/sales/sales-order-calculator";
import type { CreateSalesOrderInput, DeliverSalesOrderInput, InvoiceSalesOrderInput, QuotationToSalesOrderInput, ReserveSalesOrderInput } from "@/lib/validation/sales/sales-order";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export type SalesOrderRow = {
  id: string;
  document_no: string;
  order_date: string;
  requested_delivery_date: string | null;
  status: string;
  total_amount: number | string;
  customers: { name: string }[] | null;
  warehouses: { name: string }[] | null;
};

export type SalesOrderDetail = SalesOrderRow & {
  payment_terms: string | null;
  currency_code: string;
  notes: string | null;
  subtotal: number | string;
  discount_amount: number | string;
  tax_amount: number | string;
};

export type SalesOrderItemRow = {
  id: string;
  product_id: string | null;
  description: string;
  quantity: number | string;
  reserved_quantity: number | string;
  delivered_quantity: number | string;
  unit_price: number | string;
  line_total: number | string;
  products: { sku: string; name: string }[] | null;
};

export type SalesDeliveryPrintItemRow = {
  id: string;
  quantity: number | string;
  sort_order: number;
  products: { sku: string; name: string }[] | null;
  sales_order_items: { description: string; unit_price: number | string; line_total: number | string }[] | null;
};

export type SalesDeliveryPrintData = {
  company: { name_th: string; name_en: string | null; tax_id: string | null; phone: string | null; email: string | null; address: string | null } | null;
  delivery: {
    id: string;
    document_no: string;
    delivery_date: string;
    status: string;
    notes: string | null;
    sales_order_id: string;
    sales_orders: {
      document_no: string;
      order_date: string;
      requested_delivery_date: string | null;
      customers: { code: string; name: string; tax_id: string | null; phone: string | null; email: string | null; address: string | null }[] | null;
      warehouses: { code: string; name: string }[] | null;
    }[] | null;
  } | null;
  items: SalesDeliveryPrintItemRow[];
};

export class SalesOrderRepository {
  constructor(private readonly supabase: SupabaseServerClient) {}

  async list(companyId: string) {
    const { data, error } = await this.supabase
      .from("sales_orders")
      .select("id,document_no,order_date,requested_delivery_date,status,total_amount,customers(name),warehouses(name)")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data ?? []) as SalesOrderRow[];
  }

  async getFormOptions(companyId: string) {
    const [customers, products, warehouses] = await Promise.all([
      this.supabase.from("customers").select("id,code,name").eq("company_id", companyId).eq("is_active", true).order("name"),
      this.supabase.from("products").select("id,sku,name,selling_price").eq("company_id", companyId).eq("is_active", true).order("name"),
      this.supabase.from("warehouses").select("id,code,name").eq("company_id", companyId).eq("is_active", true).order("name"),
    ]);

    if (customers.error) throw customers.error;
    if (products.error) throw products.error;
    if (warehouses.error) throw warehouses.error;

    return {
      customers: customers.data ?? [],
      products: (products.data ?? []).map((product) => ({ ...product, selling_price: Number(product.selling_price) })),
      warehouses: warehouses.data ?? [],
    };
  }

  async getById(companyId: string, salesOrderId: string) {
    const [order, items, deliveries, events, warehouses] = await Promise.all([
      this.supabase
        .from("sales_orders")
        .select("*,customers(name),warehouses(name)")
        .eq("id", salesOrderId)
        .eq("company_id", companyId)
        .maybeSingle(),
      this.supabase
        .from("sales_order_items")
        .select("id,product_id,description,quantity,reserved_quantity,delivered_quantity,unit_price,line_total,products(sku,name)")
        .eq("sales_order_id", salesOrderId)
        .order("sort_order"),
      this.supabase
        .from("sales_deliveries")
        .select("id,document_no,delivery_date,status")
        .eq("sales_order_id", salesOrderId)
        .order("delivery_date", { ascending: false }),
      this.supabase
        .from("sales_order_events")
        .select("id,event_type,message,created_at")
        .eq("sales_order_id", salesOrderId)
        .order("created_at", { ascending: false }),
      this.supabase.from("warehouses").select("id,code,name").eq("company_id", companyId).eq("is_active", true).order("name"),
    ]);

    if (order.error) throw order.error;
    if (items.error) throw items.error;
    if (deliveries.error) throw deliveries.error;
    if (events.error) throw events.error;
    if (warehouses.error) throw warehouses.error;

    return {
      order: order.data as SalesOrderDetail | null,
      items: (items.data ?? []) as SalesOrderItemRow[],
      deliveries: deliveries.data ?? [],
      events: events.data ?? [],
      warehouses: warehouses.data ?? [],
    };
  }

  async getDeliveryPrint(companyId: string, deliveryId: string): Promise<SalesDeliveryPrintData> {
    const [company, delivery, items] = await Promise.all([
      this.supabase
        .from("companies")
        .select("name_th,name_en,tax_id,phone,email,address")
        .eq("id", companyId)
        .maybeSingle(),
      this.supabase
        .from("sales_deliveries")
        .select("id,document_no,delivery_date,status,notes,sales_order_id,sales_orders(document_no,order_date,requested_delivery_date,customers(code,name,tax_id,phone,email,address),warehouses(code,name))")
        .eq("id", deliveryId)
        .eq("company_id", companyId)
        .maybeSingle(),
      this.supabase
        .from("sales_delivery_items")
        .select("id,quantity,sort_order,products(sku,name),sales_order_items(description,unit_price,line_total)")
        .eq("delivery_id", deliveryId)
        .order("sort_order"),
    ]);

    if (company.error) throw company.error;
    if (delivery.error) throw delivery.error;
    if (items.error) throw items.error;

    return {
      company: company.data,
      delivery: delivery.data as SalesDeliveryPrintData["delivery"],
      items: (items.data ?? []) as SalesDeliveryPrintItemRow[],
    };
  }

  async create(companyId: string, input: CreateSalesOrderInput, computedItems: SalesOrderComputedItem[]) {
    const { data, error } = await this.supabase.rpc("create_sales_order", {
      p_company_id: companyId,
      p_customer_id: input.customer_id,
      p_warehouse_id: input.warehouse_id,
      p_order_date: input.order_date,
      p_requested_delivery_date: input.requested_delivery_date,
      p_payment_terms: input.payment_terms,
      p_currency_code: input.currency_code,
      p_notes: input.notes,
      p_items: computedItems,
    });

    if (error) throw error;
    return data as string;
  }

  async reserve(companyId: string, input: ReserveSalesOrderInput) {
    const { data, error } = await this.supabase.rpc("reserve_sales_order_stock", {
      p_company_id: companyId,
      p_sales_order_id: input.sales_order_id,
      p_warehouse_id: input.warehouse_id,
    });

    if (error) throw error;
    return data as string;
  }

  async deliver(companyId: string, input: DeliverSalesOrderInput) {
    const { data, error } = await this.supabase.rpc("deliver_sales_order", {
      p_company_id: companyId,
      p_sales_order_id: input.sales_order_id,
      p_delivery_date: input.delivery_date,
      p_notes: input.notes,
      p_items: input.items,
    });

    if (error) throw error;
    return data as string;
  }

  async createInvoice(companyId: string, input: InvoiceSalesOrderInput) {
    const { data, error } = await this.supabase.rpc("create_invoice_from_sales_order", {
      p_company_id: companyId,
      p_sales_order_id: input.sales_order_id,
      p_invoice_date: input.invoice_date,
      p_due_date: input.due_date,
      p_notes: input.notes,
    });

    if (error) throw error;
    return data as string;
  }

  async createFromQuotation(companyId: string, input: QuotationToSalesOrderInput) {
    const { data, error } = await this.supabase.rpc("create_sales_order_from_quotation", {
      p_company_id: companyId,
      p_quotation_id: input.quotation_id,
      p_order_date: input.order_date,
      p_requested_delivery_date: input.requested_delivery_date,
    });

    if (error) throw error;
    return data as string;
  }
}
