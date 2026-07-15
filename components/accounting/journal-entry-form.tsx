"use client";

import { useMemo, useState } from "react";

type Account = { id: string; code: string; name: string; account_type: string };
type Line = { account_id: string; description: string | null; debit: number; credit: number };

const emptyLine: Line = { account_id: "", description: null, debit: 0, credit: 0 };

export function JournalEntryForm({ accounts, action }: { accounts: Account[]; action: (fd: FormData) => void }) {
  const today = new Date().toISOString().slice(0, 10);
  const [lines, setLines] = useState<Line[]>([{ ...emptyLine }, { ...emptyLine }]);
  const totals = useMemo(
    () => lines.reduce((sum, line) => ({ debit: sum.debit + line.debit, credit: sum.credit + line.credit }), { debit: 0, credit: 0 }),
    [lines],
  );

  const patchLine = (index: number, patch: Partial<Line>) => {
    setLines((current) => current.map((line, lineIndex) => (lineIndex === index ? { ...line, ...patch } : line)));
  };

  return (
    <form action={action} className="card space-y-5 p-5">
      <input type="hidden" name="lines" value={JSON.stringify(lines)} />
      <div className="form-grid">
        <label>
          <span className="label">วันที่ Journal *</span>
          <input className="input" type="date" name="entry_date" required defaultValue={today} />
        </label>
        <label>
          <span className="label">Memo</span>
          <input className="input" name="memo" placeholder="ปรับปรุงบัญชี" />
        </label>
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <thead><tr><th>บัญชี</th><th>รายละเอียด</th><th>Debit</th><th>Credit</th><th /></tr></thead>
          <tbody>
            {lines.map((line, index) => (
              <tr key={index}>
                <td>
                  <select className="input" value={line.account_id} onChange={(event) => patchLine(index, { account_id: event.target.value })}>
                    <option value="">เลือกบัญชี</option>
                    {accounts.map((account) => (
                      <option key={account.id} value={account.id}>{account.code} - {account.name}</option>
                    ))}
                  </select>
                </td>
                <td><input className="input" value={line.description ?? ""} onChange={(event) => patchLine(index, { description: event.target.value || null })} /></td>
                <td><input className="input" type="number" min="0" step="0.01" value={line.debit} onChange={(event) => patchLine(index, { debit: Number(event.target.value), credit: 0 })} /></td>
                <td><input className="input" type="number" min="0" step="0.01" value={line.credit} onChange={(event) => patchLine(index, { credit: Number(event.target.value), debit: 0 })} /></td>
                <td><button type="button" className="btn-secondary btn-small" disabled={lines.length <= 2} onClick={() => setLines((current) => current.filter((_, lineIndex) => lineIndex !== index))}>ลบ</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button type="button" className="btn-secondary" onClick={() => setLines((current) => [...current, { ...emptyLine }])}>+ เพิ่มบรรทัด</button>
      <div className="rounded-2xl bg-slate-50 p-5">
        <div className="flex justify-between"><span>Total Debit</span><b>฿{totals.debit.toLocaleString("th-TH", { minimumFractionDigits: 2 })}</b></div>
        <div className="flex justify-between"><span>Total Credit</span><b>฿{totals.credit.toLocaleString("th-TH", { minimumFractionDigits: 2 })}</b></div>
        <div className="mt-3 flex justify-between border-t pt-3"><span>Difference</span><b>฿{Math.abs(totals.debit - totals.credit).toLocaleString("th-TH", { minimumFractionDigits: 2 })}</b></div>
      </div>
      <button className="btn-primary">Post Journal Entry</button>
    </form>
  );
}
