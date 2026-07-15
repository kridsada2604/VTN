import Link from "next/link";
import { JournalEntryForm } from "@/components/accounting/journal-entry-form";
import { PageHeader } from "@/components/page-header";
import { getJournalEntryFormOptions } from "@/lib/services/accounting/accounting-service";
import { saveManualJournalEntry } from "../actions";

export default async function Page() {
  const accounts = await getJournalEntryFormOptions();

  return (
    <div>
      <PageHeader eyebrow="ACCOUNTING" title="Manual Journal Entry" description="บันทึก Journal Entry แบบ manual โดยระบบตรวจ Debit/Credit ให้สมดุล" />
      <div className="mb-4 mt-6"><Link className="btn-secondary" href="/accounting/journal">← กลับสมุดรายวัน</Link></div>
      <JournalEntryForm accounts={accounts} action={saveManualJournalEntry} />
    </div>
  );
}
