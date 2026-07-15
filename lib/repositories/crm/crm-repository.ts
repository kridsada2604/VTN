import type { createClient } from "@/lib/supabase/server";
import type { CreateActivityInput, CreateLeadInput, CreateOpportunityInput, UpdateOpportunityStageInput } from "@/lib/validation/crm/lead";

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
  lead_id: string | null;
  customer_id: string | null;
};

export type ActivityRow = {
  id: string;
  activity_type: string;
  subject: string;
  due_at: string | null;
  completed_at: string | null;
  notes: string | null;
  lead_id: string | null;
  opportunity_id: string | null;
};

export type CustomerOption = {
  id: string;
  code: string;
  name: string;
};

export class CrmRepository {
  constructor(private readonly supabase: SupabaseServerClient) {}

  async getDashboard(companyId: string) {
    const [leads, opportunities, activities, customers] = await Promise.all([
      this.supabase.from("crm_leads").select("id,lead_no,name,company_name,email,phone,source,status,created_at").eq("company_id", companyId).order("created_at", { ascending: false }).limit(50),
      this.supabase.from("crm_opportunities").select("id,title,stage,expected_value,probability,expected_close_date,lead_id,customer_id").eq("company_id", companyId).order("expected_close_date", { ascending: true }).limit(50),
      this.supabase.from("crm_activities").select("id,activity_type,subject,due_at,completed_at,notes,lead_id,opportunity_id").eq("company_id", companyId).order("due_at", { ascending: true }).limit(50),
      this.supabase.from("customers").select("id,code,name").eq("company_id", companyId).eq("is_active", true).order("name").limit(100),
    ]);

    if (leads.error) throw leads.error;
    if (opportunities.error) throw opportunities.error;
    if (activities.error) throw activities.error;
    if (customers.error) throw customers.error;

    return {
      leads: (leads.data ?? []) as LeadRow[],
      opportunities: (opportunities.data ?? []) as OpportunityRow[],
      activities: (activities.data ?? []) as ActivityRow[],
      customers: (customers.data ?? []) as CustomerOption[],
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

  async createOpportunity(companyId: string, input: CreateOpportunityInput) {
    const { data, error } = await this.supabase.rpc("create_crm_opportunity", {
      p_company_id: companyId,
      p_lead_id: input.lead_id,
      p_customer_id: input.customer_id,
      p_title: input.title,
      p_stage: input.stage,
      p_expected_value: input.expected_value,
      p_probability: input.probability,
      p_expected_close_date: input.expected_close_date,
      p_notes: input.notes,
    });

    if (error) throw error;
    return String(data);
  }

  async updateOpportunityStage(companyId: string, input: UpdateOpportunityStageInput) {
    const { data, error } = await this.supabase.rpc("update_crm_opportunity_stage", {
      p_company_id: companyId,
      p_opportunity_id: input.opportunity_id,
      p_stage: input.stage,
      p_probability: input.probability,
    });

    if (error) throw error;
    return String(data);
  }

  async createActivity(companyId: string, input: CreateActivityInput) {
    const { data, error } = await this.supabase.rpc("create_crm_activity", {
      p_company_id: companyId,
      p_lead_id: input.lead_id,
      p_opportunity_id: input.opportunity_id,
      p_activity_type: input.activity_type,
      p_subject: input.subject,
      p_due_at: input.due_at,
      p_notes: input.notes,
    });

    if (error) throw error;
    return String(data);
  }

  async completeActivity(companyId: string, activityId: string) {
    const { data, error } = await this.supabase.rpc("complete_crm_activity", {
      p_company_id: companyId,
      p_activity_id: activityId,
    });

    if (error) throw error;
    return String(data);
  }

  async convertLeadToCustomer(companyId: string, leadId: string) {
    const { data, error } = await this.supabase.rpc("convert_crm_lead_to_customer", {
      p_company_id: companyId,
      p_lead_id: leadId,
    });

    if (error) throw error;
    return String(data);
  }
}
