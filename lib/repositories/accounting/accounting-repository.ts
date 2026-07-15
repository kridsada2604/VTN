import type { createClient } from "@/lib/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export type AccountRow = {
  id: string;
  code: string;
  name: string;
  account_type: string;
  normal_balance: string;
  is_active: boolean;
};

export type JournalEntryRow = {
  id: string;
  document_no: string;
  entry_date: string;
  source_type: string | null;
  status: string;
  memo: string | null;
};

export type JournalLineRow = {
  id: string;
  description: string | null;
  debit: number | string;
  credit: number | string;
  accounting_accounts: { code: string; name: string; account_type: string }[] | null;
  journal_entries: { document_no: string; entry_date: string; status: string }[] | null;
};

export type TrialBalanceRow = {
  accountId: string;
  code: string;
  name: string;
  accountType: string;
  debit: number;
  credit: number;
};

export type FinancialReportRow = TrialBalanceRow & {
  amount: number;
};

export class AccountingRepository {
  constructor(private readonly supabase: SupabaseServerClient) {}

  async getDashboard(companyId: string) {
    const [accounts, journalEntries, journalLines] = await Promise.all([
      this.supabase
        .from("accounting_accounts")
        .select("id,code,name,account_type,normal_balance,is_active")
        .eq("company_id", companyId)
        .order("code"),
      this.supabase
        .from("journal_entries")
        .select("id,document_no,entry_date,source_type,status,memo")
        .eq("company_id", companyId)
        .order("entry_date", { ascending: false })
        .limit(20),
      this.supabase
        .from("journal_entry_lines")
        .select("id,description,debit,credit,accounting_accounts!inner(code,name,account_type,company_id),journal_entries!inner(document_no,entry_date,status,company_id)")
        .eq("journal_entries.company_id", companyId)
        .order("entry_date", { referencedTable: "journal_entries", ascending: false })
        .limit(200),
    ]);

    if (accounts.error) throw accounts.error;
    if (journalEntries.error) throw journalEntries.error;
    if (journalLines.error) throw journalLines.error;

    return {
      accounts: (accounts.data ?? []) as AccountRow[],
      journalEntries: (journalEntries.data ?? []) as JournalEntryRow[],
      journalLines: (journalLines.data ?? []) as JournalLineRow[],
      trialBalance: this.toTrialBalance((journalLines.data ?? []) as JournalLineRow[]),
    };
  }

  async getJournalEntries(companyId: string) {
    const { data, error } = await this.supabase
      .from("journal_entries")
      .select("id,document_no,entry_date,source_type,status,memo")
      .eq("company_id", companyId)
      .order("entry_date", { ascending: false });

    if (error) throw error;
    return (data ?? []) as JournalEntryRow[];
  }

  async getLedger(companyId: string) {
    const { data, error } = await this.supabase
      .from("journal_entry_lines")
      .select("id,description,debit,credit,accounting_accounts!inner(code,name,account_type,company_id),journal_entries!inner(document_no,entry_date,status,company_id)")
      .eq("journal_entries.company_id", companyId)
      .order("entry_date", { referencedTable: "journal_entries", ascending: false })
      .limit(500);

    if (error) throw error;
    return (data ?? []) as JournalLineRow[];
  }

  async getTrialBalance(companyId: string) {
    return this.toTrialBalance(await this.getLedger(companyId));
  }

  async getFinancialReports(companyId: string) {
    const trialBalance = await this.getTrialBalance(companyId);
    const profitLossRows: FinancialReportRow[] = trialBalance
      .filter((row) => row.accountType === "REVENUE" || row.accountType === "EXPENSE")
      .map((row) => ({
        ...row,
        amount: row.accountType === "REVENUE" ? row.credit - row.debit : row.debit - row.credit,
      }));

    const balanceSheetRows: FinancialReportRow[] = trialBalance
      .filter((row) => row.accountType === "ASSET" || row.accountType === "LIABILITY" || row.accountType === "EQUITY")
      .map((row) => ({
        ...row,
        amount: row.accountType === "ASSET" ? row.debit - row.credit : row.credit - row.debit,
      }));

    const revenue = profitLossRows.filter((row) => row.accountType === "REVENUE").reduce((sum, row) => sum + row.amount, 0);
    const expense = profitLossRows.filter((row) => row.accountType === "EXPENSE").reduce((sum, row) => sum + row.amount, 0);
    const assets = balanceSheetRows.filter((row) => row.accountType === "ASSET").reduce((sum, row) => sum + row.amount, 0);
    const liabilities = balanceSheetRows.filter((row) => row.accountType === "LIABILITY").reduce((sum, row) => sum + row.amount, 0);
    const equity = balanceSheetRows.filter((row) => row.accountType === "EQUITY").reduce((sum, row) => sum + row.amount, 0);
    const cashMovement = balanceSheetRows.filter((row) => row.code === "1000").reduce((sum, row) => sum + row.amount, 0);

    return {
      profitLossRows,
      balanceSheetRows,
      totals: {
        revenue,
        expense,
        netProfit: revenue - expense,
        assets,
        liabilities,
        equity,
        liabilitiesAndEquity: liabilities + equity,
        cashMovement,
      },
    };
  }

  private toTrialBalance(lines: JournalLineRow[]): TrialBalanceRow[] {
    const grouped = new Map<string, TrialBalanceRow>();

    for (const line of lines) {
      const account = line.accounting_accounts?.[0];
      if (!account) continue;
      const key = account.code;
      const existing =
        grouped.get(key) ??
        ({
          accountId: key,
          code: account.code,
          name: account.name,
          accountType: account.account_type,
          debit: 0,
          credit: 0,
        } satisfies TrialBalanceRow);

      existing.debit += Number(line.debit || 0);
      existing.credit += Number(line.credit || 0);
      grouped.set(key, existing);
    }

    return Array.from(grouped.values()).sort((left, right) => left.code.localeCompare(right.code));
  }
}
