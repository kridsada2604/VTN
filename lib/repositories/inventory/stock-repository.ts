import type { createClient } from "@/lib/supabase/server";
import type { CreateStockMovementInput } from "@/lib/validation/inventory/stock-movement";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export type StockBalanceRow = {
  id: string;
  quantity_on_hand: number | string;
  quantity_reserved: number | string;
  average_cost: number | string;
  total_cost: number | string;
  products: { id: string; sku: string; name: string; barcode: string | null }[] | null;
  warehouses: { code: string; name: string }[] | null;
};

export type StockMovementRow = {
  id: string;
  document_no: string;
  movement_date: string;
  movement_type: string;
  status: string;
  notes: string | null;
  warehouses: { code: string; name: string }[] | null;
};

export type StockMovementItemRow = {
  id: string;
  quantity: number | string;
  unit_cost: number | string;
  line_cost: number | string;
  lot_no: string | null;
  serial_no: string | null;
  barcode: string | null;
  products: { sku: string; name: string }[] | null;
};

export type StockCardRow = {
  id: string;
  movement_id: string;
  quantity: number | string;
  unit_cost: number | string;
  line_cost: number | string;
  lot_no: string | null;
  serial_no: string | null;
  stock_movements: {
    document_no: string;
    movement_date: string;
    movement_type: string;
    warehouses: { code: string; name: string }[] | null;
  }[] | null;
  products: { sku: string; name: string }[] | null;
};

export class StockRepository {
  constructor(private readonly supabase: SupabaseServerClient) {}

  async getDashboard(companyId: string) {
    const [balances, movements] = await Promise.all([
      this.supabase
        .from("stock_balances")
        .select("id,quantity_on_hand,quantity_reserved,average_cost,total_cost,products(id,sku,name,barcode),warehouses(code,name)")
        .eq("company_id", companyId)
        .order("updated_at", { ascending: false }),
      this.supabase
        .from("stock_movements")
        .select("id,document_no,movement_date,movement_type,status,notes,warehouses(code,name)")
        .eq("company_id", companyId)
        .order("movement_date", { ascending: false })
        .limit(20),
    ]);

    if (balances.error) throw balances.error;
    if (movements.error) throw movements.error;

    return {
      balances: (balances.data ?? []) as StockBalanceRow[],
      movements: (movements.data ?? []) as StockMovementRow[],
    };
  }

  async getMovementFormOptions(companyId: string) {
    const [warehouses, products] = await Promise.all([
      this.supabase
        .from("warehouses")
        .select("id,code,name")
        .eq("company_id", companyId)
        .eq("is_active", true)
        .order("code"),
      this.supabase
        .from("products")
        .select("id,sku,name,cost_price,barcode")
        .eq("company_id", companyId)
        .eq("is_active", true)
        .order("name"),
    ]);

    if (warehouses.error) throw warehouses.error;
    if (products.error) throw products.error;

    return {
      warehouses: warehouses.data ?? [],
      products: (products.data ?? []).map((product) => ({
        ...product,
        cost_price: Number(product.cost_price),
      })),
    };
  }

  async createMovement(companyId: string, input: CreateStockMovementInput) {
    const { data, error } = await this.supabase.rpc("post_stock_movement", {
      p_company_id: companyId,
      p_warehouse_id: input.warehouse_id,
      p_movement_date: input.movement_date,
      p_movement_type: input.movement_type,
      p_notes: input.notes,
      p_items: input.items.map((item, index) => ({ ...item, sort_order: index })),
    });

    if (error) throw error;
    return String(data);
  }

  async getStockCard(companyId: string, productId?: string) {
    let query = this.supabase
      .from("stock_movement_items")
      .select("id,movement_id,quantity,unit_cost,line_cost,lot_no,serial_no,products(sku,name),stock_movements!inner(document_no,movement_date,movement_type,company_id,warehouses(code,name))")
      .eq("stock_movements.company_id", companyId)
      .order("created_at", { referencedTable: "stock_movements", ascending: false });

    if (productId) query = query.eq("product_id", productId);

    const { data, error } = await query.limit(100);
    if (error) throw error;
    return (data ?? []) as StockCardRow[];
  }
}
