import type { createClient } from "@/lib/supabase/server";
import type { CreateClaimInput, CreateClaimResolutionInput, CreateWarrantyPolicyInput, UpdateClaimStatusInput } from "@/lib/validation/claims/claim";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export type ClaimRow = {
  id: string;
  claim_no: string;
  claim_date: string;
  claim_type: string;
  priority: string;
  status: string;
  subject: string;
  customers: { name: string }[] | null;
  products: { sku: string; name: string }[] | null;
};

export type ClaimEventRow = {
  id: string;
  event_type: string;
  message: string | null;
  created_at: string;
};

export type ClaimResolutionRow = {
  id: string;
  action_type: string;
  quantity: number | string;
  amount: number | string;
  notes: string | null;
  stock_movement_id: string | null;
  created_at: string;
  products: { sku: string; name: string }[] | null;
  warehouses: { name: string }[] | null;
};

export type WarrantyPolicyRow = {
  id: string;
  policy_name: string;
  duration_days: number;
  coverage: string | null;
  is_active: boolean;
  created_at: string;
  products: { sku: string; name: string }[] | null;
};

export class ClaimRepository {
  constructor(private readonly supabase: SupabaseServerClient) {}

  async list(companyId: string) {
    const { data, error } = await this.supabase
      .from("claims")
      .select("id,claim_no,claim_date,claim_type,priority,status,subject,customers(name),products(sku,name)")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data ?? []) as ClaimRow[];
  }

  async getFormOptions(companyId: string) {
    const [customers, products] = await Promise.all([
      this.supabase.from("customers").select("id,code,name").eq("company_id", companyId).eq("is_active", true).order("name"),
      this.supabase.from("products").select("id,sku,name").eq("company_id", companyId).eq("is_active", true).order("name"),
    ]);

    if (customers.error) throw customers.error;
    if (products.error) throw products.error;

    return { customers: customers.data ?? [], products: products.data ?? [] };
  }

  async getWarrantyPolicies(companyId: string) {
    const [policies, products] = await Promise.all([
      this.supabase
        .from("warranty_policies")
        .select("id,policy_name,duration_days,coverage,is_active,created_at,products(sku,name)")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false }),
      this.supabase.from("products").select("id,sku,name").eq("company_id", companyId).eq("is_active", true).order("name"),
    ]);

    if (policies.error) throw policies.error;
    if (products.error) throw products.error;

    return {
      policies: (policies.data ?? []) as WarrantyPolicyRow[],
      products: products.data ?? [],
    };
  }

  async getById(companyId: string, claimId: string) {
    const [claim, events, resolutions, products, warehouses] = await Promise.all([
      this.supabase
        .from("claims")
        .select("id,claim_no,claim_date,claim_type,priority,status,subject,description,resolution,customers(name),products(sku,name)")
        .eq("company_id", companyId)
        .eq("id", claimId)
        .maybeSingle(),
      this.supabase.from("claim_events").select("id,event_type,message,created_at").eq("claim_id", claimId).order("created_at", { ascending: false }),
      this.supabase.from("claim_resolutions").select("id,action_type,quantity,amount,notes,stock_movement_id,created_at,products(sku,name),warehouses(name)").eq("claim_id", claimId).order("created_at", { ascending: false }),
      this.supabase.from("products").select("id,sku,name").eq("company_id", companyId).eq("is_active", true).order("name"),
      this.supabase.from("warehouses").select("id,code,name").eq("company_id", companyId).eq("is_active", true).order("name"),
    ]);

    if (claim.error) throw claim.error;
    if (events.error) throw events.error;
    if (resolutions.error) throw resolutions.error;
    if (products.error) throw products.error;
    if (warehouses.error) throw warehouses.error;

    return {
      claim: claim.data as (ClaimRow & { description: string | null; resolution: string | null }) | null,
      events: (events.data ?? []) as ClaimEventRow[],
      resolutions: (resolutions.data ?? []) as ClaimResolutionRow[],
      products: products.data ?? [],
      warehouses: warehouses.data ?? [],
    };
  }

  async create(companyId: string, input: CreateClaimInput) {
    const { data, error } = await this.supabase.rpc("create_claim", {
      p_company_id: companyId,
      p_customer_id: input.customer_id,
      p_product_id: input.product_id,
      p_claim_date: input.claim_date,
      p_claim_type: input.claim_type,
      p_priority: input.priority,
      p_subject: input.subject,
      p_description: input.description,
    });

    if (error) throw error;
    return String(data);
  }

  async updateStatus(companyId: string, input: UpdateClaimStatusInput) {
    const { data, error } = await this.supabase.rpc("update_claim_status", {
      p_company_id: companyId,
      p_claim_id: input.claim_id,
      p_status: input.status,
      p_resolution: input.resolution,
    });

    if (error) throw error;
    return String(data);
  }

  async createResolution(companyId: string, input: CreateClaimResolutionInput) {
    const { data, error } = await this.supabase.rpc("create_claim_resolution", {
      p_company_id: companyId,
      p_claim_id: input.claim_id,
      p_action_type: input.action_type,
      p_warehouse_id: input.warehouse_id,
      p_product_id: input.product_id,
      p_quantity: input.quantity,
      p_amount: input.amount,
      p_notes: input.notes,
    });

    if (error) throw error;
    return String(data);
  }

  async createWarrantyPolicy(companyId: string, input: CreateWarrantyPolicyInput) {
    const { data, error } = await this.supabase.rpc("create_warranty_policy", {
      p_company_id: companyId,
      p_product_id: input.product_id,
      p_policy_name: input.policy_name,
      p_duration_days: input.duration_days,
      p_coverage: input.coverage,
    });

    if (error) throw error;
    return String(data);
  }
}
