import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { getFinancialReports } from "@/lib/services/accounting/accounting-service";
import { formatDocumentMoney } from "@/lib/services/documents/document-engine";

export default async function Page() {
  const { balanceSheetRows, totals } = await getFinancialReports();

  return (
    <div>
      <PageHeader eyebrow="ACCOUNTING" title="Balance Sheet" description="รายงานฐานะการเงินจากยอดบัญชี Asset, Liability และ Equity" />
      <div className="my-6"><Link className="btn-secondary" href="/accounting">← กลับบัญชี</Link></div>
      <section className="grid gap-4 md:grid-cols-3">
        <div className="card p-5"><p className="text-sm text-gray-500">Assets</p><p className="mt-2 text-3xl font-black">฿{formatDocumentMoney(totals.assets)}</p></div>
        <div className="card p-5"><p className="text-sm text-gray-500">Liabilities</p><p className="mt-2 text-3xl font-black">฿{formatDocumentMoney(totals.liabilities)}</p></div>
        <div className="card p-5"><p className="text-sm text-gray-500">Equity</p><p className="mt-2 text-3xl font-black">฿{formatDocumentMoney(totals.equity)}</p></div>
      </section>
      <section className="card table-wrap mt-6">
        <table className="data-table">
          <thead><tr><th>รหัส</th><th>บัญชี</th><th>ประเภท</th><th>Debit</th><th>Credit</th><th>ยอดรายงาน</th></tr></thead>
          <tbody>{balanceSheetRows.map((row) => <tr key={row.code}><td className="font-bold">{row.code}</td><td>{row.name}</td><td>{row.accountType}</td><td>฿{formatDocumentMoney(row.debit)}</td><td>฿{formatDocumentMoney(row.credit)}</td><td className="font-bold">฿{formatDocumentMoney(row.amount)}</td></tr>)}</tbody>
        </table>
      </section>
    </div>
  );
}
