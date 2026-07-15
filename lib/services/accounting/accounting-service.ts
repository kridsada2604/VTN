import { getCurrentCompanyId } from "@/lib/current-company";
import { AccountingRepository } from "@/lib/repositories/accounting/accounting-repository";
import { createClient } from "@/lib/supabase/server";

export async function getAccountingDashboard() {
  const supabase = await createClient();
  const companyId = await getCurrentCompanyId();
  return new AccountingRepository(supabase).getDashboard(companyId);
}

export async function getJournalEntries() {
  const supabase = await createClient();
  const companyId = await getCurrentCompanyId();
  return new AccountingRepository(supabase).getJournalEntries(companyId);
}

export async function getLedger() {
  const supabase = await createClient();
  const companyId = await getCurrentCompanyId();
  return new AccountingRepository(supabase).getLedger(companyId);
}

export async function getTrialBalance() {
  const supabase = await createClient();
  const companyId = await getCurrentCompanyId();
  return new AccountingRepository(supabase).getTrialBalance(companyId);
}

export async function getFinancialReports() {
  const supabase = await createClient();
  const companyId = await getCurrentCompanyId();
  return new AccountingRepository(supabase).getFinancialReports(companyId);
}
