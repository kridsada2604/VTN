"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createProject, createProjectCost, createProjectInvoice, createProjectTask, updateProjectTask } from "@/lib/services/projects/project-service";
import { parseProjectCostForm, parseProjectForm, parseProjectInvoiceForm, parseProjectTaskForm, parseProjectTaskUpdateForm } from "@/lib/validation/projects/project";

export async function saveProject(fd: FormData) {
  const id = await createProject(parseProjectForm(fd));
  revalidatePath("/projects");
  redirect(`/projects/${id}`);
}

export async function saveProjectTask(fd: FormData) {
  const input = parseProjectTaskForm(fd);
  await createProjectTask(input);
  revalidatePath("/projects");
  revalidatePath(`/projects/${input.project_id}`);
  redirect(`/projects/${input.project_id}`);
}

export async function updateProjectTaskAction(fd: FormData) {
  const input = parseProjectTaskUpdateForm(fd);
  await updateProjectTask(input);
  revalidatePath("/projects");
  revalidatePath(`/projects/${input.project_id}`);
  redirect(`/projects/${input.project_id}`);
}

export async function saveProjectCost(fd: FormData) {
  const input = parseProjectCostForm(fd);
  await createProjectCost(input);
  revalidatePath("/projects");
  revalidatePath(`/projects/${input.project_id}`);
  revalidatePath("/accounting");
  revalidatePath("/accounting/journal");
  redirect(`/projects/${input.project_id}`);
}

export async function saveProjectInvoice(fd: FormData) {
  const input = parseProjectInvoiceForm(fd);
  const invoiceId = await createProjectInvoice(input);
  revalidatePath("/projects");
  revalidatePath(`/projects/${input.project_id}`);
  revalidatePath("/sales/invoices");
  redirect(`/sales/invoices/${invoiceId}`);
}
