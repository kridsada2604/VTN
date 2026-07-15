"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { completeActivity, convertLeadToCustomer, createActivity, createLead, createOpportunity, updateOpportunityStage } from "@/lib/services/crm/crm-service";
import { parseActivityForm, parseLeadForm, parseOpportunityForm, parseOpportunityStageForm } from "@/lib/validation/crm/lead";

export async function saveLead(fd: FormData) {
  await createLead(parseLeadForm(fd));
  revalidatePath("/crm");
  redirect("/crm");
}

export async function saveOpportunity(fd: FormData) {
  await createOpportunity(parseOpportunityForm(fd));
  revalidatePath("/crm");
  redirect("/crm");
}

export async function saveOpportunityStage(fd: FormData) {
  await updateOpportunityStage(parseOpportunityStageForm(fd));
  revalidatePath("/crm");
  redirect("/crm");
}

export async function saveActivity(fd: FormData) {
  await createActivity(parseActivityForm(fd));
  revalidatePath("/crm");
  revalidatePath("/crm/activities");
  redirect(String(fd.get("redirect_to") ?? "/crm/activities"));
}

export async function completeActivityAction(fd: FormData) {
  await completeActivity(String(fd.get("activity_id") ?? ""));
  revalidatePath("/crm");
  revalidatePath("/crm/activities");
  redirect(String(fd.get("redirect_to") ?? "/crm/activities"));
}

export async function convertLeadAction(fd: FormData) {
  await convertLeadToCustomer(String(fd.get("lead_id") ?? ""));
  revalidatePath("/crm");
  revalidatePath("/customers");
  redirect("/crm");
}
