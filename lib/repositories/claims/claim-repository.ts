import type { createClient } from "@/lib/supabase/server";
import type { CreateClaimInput } from "@/lib/validation/claims/claim";

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

  async getById(companyId: string, claimId: string) {
    const [claim, events] = await Promise.all([
      this.supabase
        .from("claims")
        .select("id,claim_no,claim_date,claim_type,priority,status,subject,description,resolution,customers(name),products(sku,name)")
        .eq("company_id", companyId)
        .eq("id", claimId)
        .maybeSingle(),
      this.supabase.from("claim_events").select("id,event_type,message,created_at").eq("claim_id", claimId).order("created_at", { ascending: false }),
    ]);

    if (claim.error) throw claim.error;
    if (events.error) throw events.error;

    return {
      claim: claim.data as (ClaimRow & { description: string | null; resolution: string | null }) | null,
      events: (events.data ?? []) as ClaimEventRow[],
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
}
