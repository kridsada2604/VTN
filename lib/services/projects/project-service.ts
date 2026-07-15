import { getCurrentCompanyId } from "@/lib/current-company";
import { ProjectRepository } from "@/lib/repositories/projects/project-repository";
import { createClient } from "@/lib/supabase/server";
import type { CreateProjectInput, CreateProjectTaskInput, UpdateProjectTaskInput } from "@/lib/validation/projects/project";

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
