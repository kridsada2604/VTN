"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createProject, createProjectTask, updateProjectTask } from "@/lib/services/projects/project-service";
import { parseProjectForm, parseProjectTaskForm, parseProjectTaskUpdateForm } from "@/lib/validation/projects/project";

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
