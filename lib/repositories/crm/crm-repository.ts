import type { createClient } from "@/lib/supabase/server";
import type { CreateLeadInput } from "@/lib/validation/crm/lead";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export type LeadRow = {
  id: string;
  lead_no: string;
  name: string;
  company_name: string | null;
  email: string | null;
  phone: string | null;
  source: string | null;
  status: string;
  created_at: string;
};

export type OpportunityRow = {
  id: string;
  title: string;
  stage: string;
  expected_value: number | string;
  probability: number;
  expected_close_date: string | null;
};

export type ActivityRow = {
  id: string;
  activity_type: string;
  subject: string;
  due_at: string | null;
  completed_at: string | null;
  notes: string | null;
};

export class CrmRepository {
  constructor(private readonly supabase: SupabaseServerClient) {}

  async getDashboard(companyId: string) {
    const [leads, opportunities, activities] = await Promise.all([
      this.supabase.from("crm_leads").select("id,lead_no,name,company_name,email,phone,source,status,created_at").eq("company_id", companyId).order("created_at", { ascending: false }).limit(50),
      this.supabase.from("crm_opportunities").select("id,title,stage,expected_value,probability,expected_close_date").eq("company_id", companyId).order("expected_close_date", { ascending: true }).limit(50),
      this.supabase.from("crm_activities").select("id,activity_type,subject,due_at,completed_at,notes").eq("company_id", companyId).order("due_at", { ascending: true }).limit(50),
    ]);

    if (leads.error) throw leads.error;
    if (opportunities.error) throw opportunities.error;
    if (activities.error) throw activities.error;

    return {
      leads: (leads.data ?? []) as LeadRow[],
      opportunities: (opportunities.data ?? []) as OpportunityRow[],
      activities: (activities.data ?? []) as ActivityRow[],
    };
  }

  async createLead(companyId: string, input: CreateLeadInput) {
    const { data, error } = await this.supabase.rpc("create_crm_lead", {
      p_company_id: companyId,
      p_name: input.name,
      p_company_name: input.company_name,
      p_email: input.email,
      p_phone: input.phone,
      p_source: input.source,
      p_notes: input.notes,
    });

    if (error) throw error;
    return String(data);
  }
}
