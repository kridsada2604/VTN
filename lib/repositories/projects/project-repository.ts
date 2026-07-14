import type { createClient } from "@/lib/supabase/server";
import type { CreateProjectInput } from "@/lib/validation/projects/project";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export type ProjectRow = {
  id: string;
  project_no: string;
  name: string;
  status: string;
  start_date: string | null;
  end_date: string | null;
  budget_amount: number | string;
  actual_cost: number | string;
  revenue_amount: number | string;
  customers: { name: string }[] | null;
};

export type ProjectTaskRow = {
  id: string;
  title: string;
  status: string;
  due_date: string | null;
  estimated_hours: number | string;
  actual_hours: number | string;
};

export class ProjectRepository {
  constructor(private readonly supabase: SupabaseServerClient) {}

  async list(companyId: string) {
    const { data, error } = await this.supabase
      .from("projects")
      .select("id,project_no,name,status,start_date,end_date,budget_amount,actual_cost,revenue_amount,customers(name)")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data ?? []) as ProjectRow[];
  }

  async getFormOptions(companyId: string) {
    const { data, error } = await this.supabase.from("customers").select("id,code,name").eq("company_id", companyId).eq("is_active", true).order("name");
    if (error) throw error;
    return { customers: data ?? [] };
  }

  async getById(companyId: string, projectId: string) {
    const [project, tasks] = await Promise.all([
      this.supabase
        .from("projects")
        .select("id,project_no,name,status,start_date,end_date,budget_amount,actual_cost,revenue_amount,notes,customers(name)")
        .eq("company_id", companyId)
        .eq("id", projectId)
        .maybeSingle(),
      this.supabase.from("project_tasks").select("id,title,status,due_date,estimated_hours,actual_hours").eq("company_id", companyId).eq("project_id", projectId).order("sort_order"),
    ]);

    if (project.error) throw project.error;
    if (tasks.error) throw tasks.error;

    return {
      project: project.data as (ProjectRow & { notes: string | null }) | null,
      tasks: (tasks.data ?? []) as ProjectTaskRow[],
    };
  }

  async create(companyId: string, input: CreateProjectInput) {
    const { data, error } = await this.supabase.rpc("create_project", {
      p_company_id: companyId,
      p_customer_id: input.customer_id,
      p_name: input.name,
      p_start_date: input.start_date,
      p_end_date: input.end_date,
      p_budget_amount: input.budget_amount,
      p_notes: input.notes,
    });

    if (error) throw error;
    return String(data);
  }
}
