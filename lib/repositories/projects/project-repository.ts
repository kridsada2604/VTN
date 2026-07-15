import type { createClient } from "@/lib/supabase/server";
import type { CreateProjectCostInput, CreateProjectInput, CreateProjectTaskInput, UpdateProjectTaskInput } from "@/lib/validation/projects/project";

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
  sort_order: number;
};

export type ProjectCostRow = {
  id: string;
  cost_date: string;
  cost_type: string;
  description: string;
  amount: number | string;
  journal_entry_id: string | null;
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
    const [project, tasks, costs] = await Promise.all([
      this.supabase
        .from("projects")
        .select("id,project_no,name,status,start_date,end_date,budget_amount,actual_cost,revenue_amount,notes,customers(name)")
        .eq("company_id", companyId)
        .eq("id", projectId)
        .maybeSingle(),
      this.supabase.from("project_tasks").select("id,title,status,due_date,estimated_hours,actual_hours,sort_order").eq("company_id", companyId).eq("project_id", projectId).order("sort_order"),
      this.supabase.from("project_costs").select("id,cost_date,cost_type,description,amount,journal_entry_id").eq("company_id", companyId).eq("project_id", projectId).order("cost_date", { ascending: false }).limit(50),
    ]);

    if (project.error) throw project.error;
    if (tasks.error) throw tasks.error;
    if (costs.error) throw costs.error;

    return {
      project: project.data as (ProjectRow & { notes: string | null }) | null,
      tasks: (tasks.data ?? []) as ProjectTaskRow[],
      costs: (costs.data ?? []) as ProjectCostRow[],
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

  async createTask(companyId: string, input: CreateProjectTaskInput) {
    const { data, error } = await this.supabase.rpc("create_project_task", {
      p_company_id: companyId,
      p_project_id: input.project_id,
      p_title: input.title,
      p_due_date: input.due_date,
      p_estimated_hours: input.estimated_hours,
      p_sort_order: input.sort_order,
    });

    if (error) throw error;
    return String(data);
  }

  async updateTask(companyId: string, input: UpdateProjectTaskInput) {
    const { data, error } = await this.supabase.rpc("update_project_task", {
      p_company_id: companyId,
      p_task_id: input.task_id,
      p_status: input.status,
      p_due_date: input.due_date,
      p_estimated_hours: input.estimated_hours,
      p_actual_hours: input.actual_hours,
    });

    if (error) throw error;
    return String(data);
  }

  async createCost(companyId: string, input: CreateProjectCostInput) {
    const { data, error } = await this.supabase.rpc("create_project_cost", {
      p_company_id: companyId,
      p_project_id: input.project_id,
      p_cost_date: input.cost_date,
      p_cost_type: input.cost_type,
      p_description: input.description,
      p_amount: input.amount,
    });

    if (error) throw error;
    return String(data);
  }
}
