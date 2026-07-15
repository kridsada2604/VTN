"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createManualJournalEntry } from "@/lib/services/accounting/accounting-service";
import { parseJournalEntryForm } from "@/lib/validation/accounting/journal-entry";

export async function saveManualJournalEntry(fd: FormData) {
  await createManualJournalEntry(parseJournalEntryForm(fd));
  revalidatePath("/accounting");
  revalidatePath("/accounting/journal");
  revalidatePath("/accounting/ledger");
  revalidatePath("/accounting/trial-balance");
  redirect("/accounting/journal");
}
