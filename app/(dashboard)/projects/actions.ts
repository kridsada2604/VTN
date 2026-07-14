"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createProject } from "@/lib/services/projects/project-service";
import { parseProjectForm } from "@/lib/validation/projects/project";

export async function saveProject(fd: FormData) {
  const id = await createProject(parseProjectForm(fd));
  revalidatePath("/projects");
  redirect(`/projects/${id}`);
}
