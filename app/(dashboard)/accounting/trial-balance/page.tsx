import { PageHeader } from "@/components/page-header";
import { getTrialBalance } from "@/lib/services/accounting/accounting-service";
import { formatDocumentMoney } from "@/lib/services/documents/document-engine";

export default async function Page() {
  const rows = await getTrialBalance();
  const debitTotal = rows.reduce((sum, row) => sum + row.debit, 0);
  const creditTotal = rows.reduce((sum, row) => sum + row.credit, 0);

  return (
    <div>
      <PageHeader eyebrow="ACCOUNTING" title="งบทดลอง" description="ตรวจสอบยอดรวม Debit และ Credit ของบัญชีทั้งหมด" />
      <section className="card table-wrap mt-6">
        <table className="data-table">
          <thead>
            <tr>
              <th>รหัส</th>
              <th>ชื่อบัญชี</th>
              <th>ประเภท</th>
              <th>Debit</th>
              <th>Credit</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.accountId}>
                <td className="font-bold">{row.code}</td>
                <td>{row.name}</td>
                <td>{row.accountType}</td>
                <td>฿{formatDocumentMoney(row.debit)}</td>
                <td>฿{formatDocumentMoney(row.credit)}</td>
              </tr>
            ))}
            <tr>
              <td className="font-bold" colSpan={3}>
                รวม
              </td>
              <td className="font-black">฿{formatDocumentMoney(debitTotal)}</td>
              <td className="font-black">฿{formatDocumentMoney(creditTotal)}</td>
            </tr>
          </tbody>
        </table>
      </section>
    </div>
  );
}
