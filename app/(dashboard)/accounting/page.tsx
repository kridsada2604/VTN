import Link from "next/link";
import { BookOpen, ChartNoAxesCombined, Landmark, Scale } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { getAccountingDashboard } from "@/lib/services/accounting/accounting-service";
import { formatDocumentMoney } from "@/lib/services/documents/document-engine";

const modules = [
  ["/accounting/journal", "สมุดรายวัน", "รายการ Journal Entry ที่ถูก posted", Landmark],
  ["/accounting/ledger", "บัญชีแยกประเภท", "ดู debit/credit แยกบัญชี", BookOpen],
  ["/accounting/trial-balance", "งบทดลอง", "ตรวจยอด debit และ credit", Scale],
  ["/accounting/profit-loss", "Profit / Loss", "รายงานกำไรขาดทุน", ChartNoAxesCombined],
  ["/accounting/balance-sheet", "Balance Sheet", "รายงานฐานะการเงิน", ChartNoAxesCombined],
  ["/accounting/cash-flow", "Cash Flow", "รายงานกระแสเงินสด", ChartNoAxesCombined],
] as const;

export default async function Page() {
  const { accounts, journalEntries, trialBalance } = await getAccountingDashboard();
  const debitTotal = trialBalance.reduce((sum, row) => sum + row.debit, 0);
  const creditTotal = trialBalance.reduce((sum, row) => sum + row.credit, 0);

  return (
    <div>
      <PageHeader eyebrow="ACCOUNTING" title="บัญชี" description="ศูนย์กลางบัญชีแบบ Double-entry พร้อม Journal, Ledger และ Trial Balance" />
      <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="card p-5">
          <p className="text-sm text-gray-500">ผังบัญชี</p>
          <p className="mt-2 text-3xl font-black">{accounts.length}</p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-gray-500">Journal Posted</p>
          <p className="mt-2 text-3xl font-black">{journalEntries.length}</p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-gray-500">Debit</p>
          <p className="mt-2 text-3xl font-black text-green-700">฿{formatDocumentMoney(debitTotal)}</p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-gray-500">Credit</p>
          <p className="mt-2 text-3xl font-black text-orange-700">฿{formatDocumentMoney(creditTotal)}</p>
        </div>
      </section>

      <section className="module-grid mt-7">
        {modules.map(([href, title, desc, Icon]) => (
          <Link href={href} key={title} className="card module-link p-5">
            <Icon className="text-orange-600" />
            <h2 className="mt-4 font-black">{title}</h2>
            <p className="mt-2 text-sm text-gray-500">{desc}</p>
          </Link>
        ))}
      </section>

      <section className="card table-wrap mt-7">
        <div className="border-b p-4">
          <h2 className="font-black">ผังบัญชีเริ่มต้น</h2>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>รหัส</th>
              <th>ชื่อบัญชี</th>
              <th>ประเภท</th>
              <th>Normal Balance</th>
              <th>สถานะ</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((account) => (
              <tr key={account.id}>
                <td className="font-bold">{account.code}</td>
                <td>{account.name}</td>
                <td>{account.account_type}</td>
                <td>{account.normal_balance}</td>
                <td>{account.is_active ? "ใช้งาน" : "ปิดใช้งาน"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
