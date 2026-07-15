import type { createClient } from "@/lib/supabase/server";
import type { PurchaseOrderComputedItem, PurchaseOrderTotals } from "@/lib/services/purchase/purchase-order-calculator";
import type { CreatePurchaseOrderInput, PayPurchaseOrderInput, ReceivePurchaseOrderInput } from "@/lib/validation/purchase/purchase-order";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export type PurchaseOrderListRow = {
  id: string;
  document_no: string;
  order_date: string;
  expected_date: string | null;
  status: string;
  total_amount: number | string;
  paid_amount: number | string;
  balance_amount: number | string;
  journal_entry_id: string | null;
  suppliers: { name: string }[] | null;
};

export type PurchaseOrderDetail = PurchaseOrderListRow & {
  notes: string | null;
  currency_code: string;
  subtotal: number | string;
  discount_amount: number | string;
  tax_amount: number | string;
  suppliers: { code: string; name: string; tax_id: string | null; phone: string | null; email: string | null; address: string | null }[] | null;
};

export type PurchaseOrderItemRow = {
  id: string;
  product_id?: string | null;
  description: string;
  quantity: number | string;
  unit_cost: number | string;
  line_discount: number | string;
  line_tax: number | string;
  line_total: number | string;
  quantity_received?: number | string;
};

export type PurchasePaymentRow = {
  id: string;
  payment_no: string;
  payment_date: string;
  method: string;
  amount: number | string;
  reference_no: string | null;
  journal_entry_id: string | null;
};

export type PurchaseOrderEventRow = {
  id: string;
  event_type: string;
  message: string | null;
  created_at: string;
};

export class PurchaseOrderRepository {
  constructor(private readonly supabase: SupabaseServerClient) {}

  async list(companyId: string) {
    const { data, error } = await this.supabase
      .from("purchase_orders")
      .select("id,document_no,order_date,expected_date,status,total_amount,paid_amount,balance_amount,journal_entry_id,suppliers(name)")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data ?? []) as PurchaseOrderListRow[];
  }

  async getFormOptions(companyId: string) {
    const [suppliers, products] = await Promise.all([
      this.supabase.from("suppliers").select("id,code,name").eq("company_id", companyId).eq("is_active", true).order("name"),
      this.supabase.from("products").select("id,sku,name,cost_price").eq("company_id", companyId).eq("is_active", true).order("name"),
    ]);

    if (suppliers.error) throw suppliers.error;
    if (products.error) throw products.error;

    return {
      suppliers: suppliers.data ?? [],
      products: (products.data ?? []).map((product) => ({ ...product, cost_price: Number(product.cost_price) })),
    };
  }

  async getById(companyId: string, purchaseOrderId: string) {
    const [order, items, payments, events] = await Promise.all([
      this.supabase
        .from("purchase_orders")
        .select("*,suppliers(code,name,tax_id,phone,email,address)")
        .eq("company_id", companyId)
        .eq("id", purchaseOrderId)
        .maybeSingle(),
      this.supabase.from("purchase_order_items").select("id,product_id,description,quantity,unit_cost,line_discount,line_tax,line_total,quantity_received").eq("purchase_order_id", purchaseOrderId).order("sort_order"),
      this.supabase
        .from("purchase_order_payments")
        .select("id,payment_no,payment_date,method,amount,reference_no,journal_entry_id")
        .eq("purchase_order_id", purchaseOrderId)
        .order("payment_date", { ascending: false }),
      this.supabase
        .from("purchase_order_events")
        .select("id,event_type,message,created_at")
        .eq("purchase_order_id", purchaseOrderId)
        .order("created_at", { ascending: false }),
    ]);

    if (order.error) throw order.error;
    if (items.error) throw items.error;
    if (payments.error) throw payments.error;
    if (events.error) throw events.error;

    return {
      order: order.data as PurchaseOrderDetail | null,
      items: (items.data ?? []) as PurchaseOrderItemRow[],
      payments: (payments.data ?? []) as PurchasePaymentRow[],
      events: (events.data ?? []) as PurchaseOrderEventRow[],
    };
  }

  async create(companyId: string, input: CreatePurchaseOrderInput, computedItems: PurchaseOrderComputedItem[], totals: PurchaseOrderTotals) {
    const { data, error } = await this.supabase.rpc("create_purchase_order", {
      p_company_id: companyId,
      p_supplier_id: input.supplier_id,
      p_order_date: input.order_date,
      p_expected_date: input.expected_date,
      p_currency_code: input.currency_code,
      p_notes: input.notes,
      p_items: computedItems,
      p_subtotal: totals.subtotal,
      p_discount_amount: totals.discount_amount,
      p_tax_amount: totals.tax_amount,
      p_total_amount: totals.total_amount,
    });

    if (error) throw error;
    return String(data);
  }

  async getReceiveOptions(companyId: string, purchaseOrderId: string) {
    const [detail, warehouses] = await Promise.all([
      this.getById(companyId, purchaseOrderId),
      this.supabase.from("warehouses").select("id,code,name").eq("company_id", companyId).eq("is_active", true).order("code"),
    ]);

    if (warehouses.error) throw warehouses.error;

    return {
      ...detail,
      warehouses: warehouses.data ?? [],
    };
  }

  async receive(companyId: string, input: ReceivePurchaseOrderInput) {
    const { data, error } = await this.supabase.rpc("receive_purchase_order", {
      p_company_id: companyId,
      p_purchase_order_id: input.purchase_order_id,
      p_warehouse_id: input.warehouse_id,
      p_receipt_date: input.receipt_date,
      p_notes: input.notes,
      p_items: input.items.map((item, index) => ({ ...item, sort_order: index })),
    });

    if (error) throw error;
    return String(data);
  }

  async postToAccounting(companyId: string, purchaseOrderId: string) {
    const { data, error } = await this.supabase.rpc("post_purchase_order_to_accounting", {
      p_company_id: companyId,
      p_purchase_order_id: purchaseOrderId,
    });

    if (error) throw error;
    return String(data);
  }

  async pay(companyId: string, input: PayPurchaseOrderInput) {
    const { data, error } = await this.supabase.rpc("pay_purchase_order", {
      p_company_id: companyId,
      p_purchase_order_id: input.purchase_order_id,
      p_payment_date: input.payment_date,
      p_method: input.method,
      p_amount: input.amount,
      p_reference_no: input.reference_no,
      p_notes: input.notes,
    });

    if (error) throw error;
    return String(data);
  }
}
