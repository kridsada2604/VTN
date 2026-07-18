"use server";

import { revalidatePath } from "next/cache";
import { updateCompanyTaxProfile } from "@/lib/services/core/company-service";
import { parseCompanyTaxProfileForm } from "@/lib/validation/core/company-tax";

export async function saveCompanyTaxProfile(fd: FormData) {
  await updateCompanyTaxProfile(parseCompanyTaxProfileForm(fd));
  revalidatePath("/company");
  revalidatePath("/sales/quotations/new");
  revalidatePath("/sales/invoices/new");
}