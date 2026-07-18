import { getCurrentCompanyId } from "@/lib/current-company";
import { CompanyRepository } from "@/lib/repositories/core/company-repository";
import { ProjectRepository } from "@/lib/repositories/projects/project-repository";
import { createClient } from "@/lib/supabase/server";
import type { CreateProjectCostInput, CreateProjectInput, CreateProjectInvoiceInput, CreateProjectTaskInput, UpdateProjectTaskInput } from "@/lib/validation/projects/project";

export async function getProjects() {
  const supabase = await createClient();
  const companyId = await getCurrentCompanyId();
  return new ProjectRepository(supabase).list(companyId);
}

export async function getProjectFormOptions() {
  const supabase = await createClient();
  const companyId = await getCurrentCompanyId();
  return new ProjectRepository(supabase).getFormOptions(companyId);
}

export async function getProjectDetail(projectId: string) {
  const supabase = await createClient();
  const companyId = await getCurrentCompanyId();
  return new ProjectRepository(supabase).getById(companyId, projectId);
}

export async function createProject(input: CreateProjectInput) {
  const supabase = await createClient();
  const companyId = await getCurrentCompanyId();
  return new ProjectRepository(supabase).create(companyId, input);
}

export async function createProjectTask(input: CreateProjectTaskInput) {
  const supabase = await createClient();
  const companyId = await getCurrentCompanyId();
  return new ProjectRepository(supabase).createTask(companyId, input);
}

export async function updateProjectTask(input: UpdateProjectTaskInput) {
  const supabase = await createClient();
  const companyId = await getCurrentCompanyId();
  return new ProjectRepository(supabase).updateTask(companyId, input);
}

export async function createProjectCost(input: CreateProjectCostInput) {
  const supabase = await createClient();
  const companyId = await getCurrentCompanyId();
  return new ProjectRepository(supabase).createCost(companyId, input);
}

export async function createProjectInvoice(input: CreateProjectInvoiceInput) {
  const supabase = await createClient();
  const companyId = await getCurrentCompanyId();
  const taxDefaults = await new CompanyRepository(supabase).getTaxDefaults(companyId);
  const normalizedInput = taxDefaults.is_vat_registered ? input : { ...input, tax_rate: 0 };
  return new ProjectRepository(supabase).createInvoice(companyId, normalizedInput);
}
