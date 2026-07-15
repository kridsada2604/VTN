import type { createClient } from "@/lib/supabase/server";
import type { ClosePosSessionInput, CreatePosSaleInput, OpenPosSessionInput } from "@/lib/validation/pos/pos-sale";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export type PosSaleListRow = {
  id: string;
  sale_no: string;
  sale_date: string;
  payment_method: string;
  total_amount: number | string;
  paid_amount: number | string;
  change_amount: number | string;
  status: string;
  customers: { name: string }[] | null;
  warehouses: { name: string }[] | null;
};

export type PosSessionRow = {
  id: string;
  warehouse_id: string;
  opened_at: string;
  closed_at: string | null;
  opening_cash: number | string;
  closing_cash: number | string | null;
  status: string;
  notes: string | null;
  warehouses: { name: string }[] | null;
};

export type PosSaleDetail = {
  id: string;
  sale_no: string;
  sale_date: string;
  payment_method: string;
  status: string;
  subtotal: number | string;
  discount_amount: number | string;
  tax_amount: number | string;
  total_amount: number | string;
  paid_amount: number | string;
  change_amount: number | string;
  notes: string | null;
  customers: { name: string; phone: string | null }[] | null;
  warehouses: { name: string }[] | null;
};

export type PosSaleItemRow = {
  id: string;
  description: string;
  quantity: number | string;
  unit_price: number | string;
  line_discount: number | string;
  line_tax: number | string;
  line_total: number | string;
  products: { sku: string; name: string }[] | null;
};

export class PosSaleRepository {
  constructor(private readonly supabase: SupabaseServerClient) {}

  async list(companyId: string) {
    const [sales, sessions, warehouses] = await Promise.all([
      this.supabase
      .from("pos_sales")
      .select("id,sale_no,sale_date,payment_method,total_amount,paid_amount,change_amount,status,customers(name),warehouses(name)")
      .eq("company_id", companyId)
        .order("created_at", { ascending: false }),
      this.supabase
        .from("pos_sessions")
        .select("id,warehouse_id,opened_at,closed_at,opening_cash,closing_cash,status,notes,warehouses(name)")
        .eq("company_id", companyId)
        .order("opened_at", { ascending: false }),
      this.supabase.from("warehouses").select("id,code,name").eq("company_id", companyId).eq("is_active", true).order("name"),
    ]);

    if (sales.error) throw sales.error;
    if (sessions.error) throw sessions.error;
    if (warehouses.error) throw warehouses.error;

    return {
      sales: (sales.data ?? []) as PosSaleListRow[],
      sessions: (sessions.data ?? []) as PosSessionRow[],
      warehouses: warehouses.data ?? [],
    };
  }

  async getFormOptions(companyId: string) {
    const [customers, products, warehouses] = await Promise.all([
      this.supabase.from("customers").select("id,code,name").eq("company_id", companyId).eq("is_active", true).order("name"),
      this.supabase.from("products").select("id,sku,name,barcode,selling_price").eq("company_id", companyId).eq("is_active", true).order("name"),
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

  async getById(companyId: string, saleId: string) {
    const [sale, items] = await Promise.all([
      this.supabase.from("pos_sales").select("*,customers(name,phone),warehouses(name)").eq("id", saleId).eq("company_id", companyId).maybeSingle(),
      this.supabase.from("pos_sale_items").select("id,description,quantity,unit_price,line_discount,line_tax,line_total,products(sku,name)").eq("sale_id", saleId).order("sort_order"),
    ]);

    if (sale.error) throw sale.error;
    if (items.error) throw items.error;

    return {
      sale: sale.data as PosSaleDetail | null,
      items: (items.data ?? []) as PosSaleItemRow[],
    };
  }

  async create(companyId: string, input: CreatePosSaleInput) {
    const items = input.items.map((item, index) => ({ ...item, sort_order: index + 1 }));
    const { data: session } = await this.supabase
      .from("pos_sessions")
      .select("id")
      .eq("company_id", companyId)
      .eq("warehouse_id", input.warehouse_id)
      .eq("status", "OPEN")
      .order("opened_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data, error } = await this.supabase.rpc("create_pos_sale", {
      p_company_id: companyId,
      p_session_id: session?.id ?? null,
      p_warehouse_id: input.warehouse_id,
      p_customer_id: input.customer_id,
      p_sale_date: input.sale_date,
      p_payment_method: input.payment_method,
      p_paid_amount: input.paid_amount,
      p_notes: input.notes,
      p_items: items,
    });

    if (error) throw error;
    return data as string;
  }

  async openSession(companyId: string, input: OpenPosSessionInput) {
    const { data, error } = await this.supabase.rpc("open_pos_session", {
      p_company_id: companyId,
      p_warehouse_id: input.warehouse_id,
      p_opening_cash: input.opening_cash,
      p_notes: input.notes,
    });

    if (error) throw error;
    return String(data);
  }

  async closeSession(companyId: string, input: ClosePosSessionInput) {
    const { data, error } = await this.supabase.rpc("close_pos_session", {
      p_company_id: companyId,
      p_session_id: input.session_id,
      p_closing_cash: input.closing_cash,
      p_notes: input.notes,
    });

    if (error) throw error;
    return String(data);
  }
}
