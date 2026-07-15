import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { getFinancialReports } from "@/lib/services/accounting/accounting-service";
import { formatDocumentMoney } from "@/lib/services/documents/document-engine";

export default async function Page() {
  const { balanceSheetRows, totals } = await getFinancialReports();
  const cashRows = balanceSheetRows.filter((row) => row.code === "1000");

  return (
    <div>
      <PageHeader eyebrow="ACCOUNTING" title="Cash Flow" description="Cash flow foundation จากบัญชีเงินสดและเงินฝากธนาคาร" />
      <div className="my-6"><Link className="btn-secondary" href="/accounting">← กลับบัญชี</Link></div>
      <section className="card p-5">
        <p className="text-sm text-gray-500">Net Cash Movement</p>
        <p className="mt-2 text-4xl font-black text-orange-700">฿{formatDocumentMoney(totals.cashMovement)}</p>
      </section>
      <section className="card table-wrap mt-6">
        <table className="data-table">
          <thead><tr><th>รหัส</th><th>บัญชี</th><th>Debit</th><th>Credit</th><th>Cash Movement</th></tr></thead>
          <tbody>{cashRows.map((row) => <tr key={row.code}><td className="font-bold">{row.code}</td><td>{row.name}</td><td>฿{formatDocumentMoney(row.debit)}</td><td>฿{formatDocumentMoney(row.credit)}</td><td className="font-bold">฿{formatDocumentMoney(row.amount)}</td></tr>)}</tbody>
        </table>
        {!cashRows.length && <p className="p-6 text-gray-500">ยังไม่มี movement ในบัญชีเงินสดและเงินฝากธนาคาร</p>}
      </section>
    </div>
  );
}
