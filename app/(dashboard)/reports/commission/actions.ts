"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createCommissionRule, createCommissionRun } from "@/lib/services/reports/commission-service";
import { parseCommissionRuleForm, parseCommissionRunForm } from "@/lib/validation/reports/commission";

export async function saveCommissionRule(fd: FormData) {
  await createCommissionRule(parseCommissionRuleForm(fd));
  revalidatePath("/reports");
  revalidatePath("/reports/SALE_OUT");
  revalidatePath("/reports/commission");
  redirect("/reports/commission");
}

export async function calculateCommissionRun(fd: FormData) {
  await createCommissionRun(parseCommissionRunForm(fd));
  revalidatePath("/reports");
  revalidatePath("/reports/SALE_OUT");
  revalidatePath("/reports/commission");
  redirect("/reports/commission");
}
