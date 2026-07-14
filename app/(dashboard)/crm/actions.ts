"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createLead } from "@/lib/services/crm/crm-service";
import { parseLeadForm } from "@/lib/validation/crm/lead";

export async function saveLead(fd: FormData) {
  await createLead(parseLeadForm(fd));
  revalidatePath("/crm");
  redirect("/crm");
}
