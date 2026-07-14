import { PageHeader } from "@/components/page-header";
import { getLedger } from "@/lib/services/accounting/accounting-service";
import { formatDocumentMoney } from "@/lib/services/documents/document-engine";

export default async function Page() {
  const rows = await getLedger();

  return (
    <div>
      <PageHeader eyebrow="ACCOUNTING" title="บัญชีแยกประเภท" description="รายการ debit และ credit แยกตามบัญชี" />
      <section className="card table-wrap mt-6">
        <table className="data-table">
          <thead>
            <tr>
              <th>วันที่</th>
              <th>เลขที่</th>
              <th>บัญชี</th>
              <th>รายละเอียด</th>
              <th>Debit</th>
              <th>Credit</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const entry = row.journal_entries?.[0];
              const account = row.accounting_accounts?.[0];
              return (
                <tr key={row.id}>
                  <td>{entry?.entry_date}</td>
                  <td className="font-bold">{entry?.document_no}</td>
                  <td>{account ? `${account.code} - ${account.name}` : "-"}</td>
                  <td>{row.description ?? "-"}</td>
                  <td>฿{formatDocumentMoney(row.debit)}</td>
                  <td>฿{formatDocumentMoney(row.credit)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!rows.length && <p className="p-6 text-gray-500">ยังไม่มีรายการบัญชีแยกประเภท</p>}
      </section>
    </div>
  );
}
