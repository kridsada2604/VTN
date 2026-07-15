export type JournalEntryLineInput = {
  account_id: string;
  description: string | null;
  debit: number;
  credit: number;
};

export type CreateJournalEntryInput = {
  entry_date: string;
  memo: string | null;
  lines: JournalEntryLineInput[];
};

const text = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();

const numberOrZero = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export function parseJournalEntryForm(fd: FormData): CreateJournalEntryInput {
  let lines: JournalEntryLineInput[] = [];

  try {
    const parsed = JSON.parse(text(fd, "lines") || "[]") as Array<Partial<JournalEntryLineInput>>;
    lines = parsed.map((line) => ({
      account_id: String(line.account_id ?? "").trim(),
      description: line.description ? String(line.description).trim() : null,
      debit: numberOrZero(line.debit),
      credit: numberOrZero(line.credit),
    }));
  } catch {
    throw new Error("รายการ Journal ไม่ถูกต้อง");
  }

  const input = {
    entry_date: text(fd, "entry_date"),
    memo: text(fd, "memo") || null,
    lines,
  };

  if (!input.entry_date) throw new Error("กรุณาระบุวันที่ Journal");
  if (input.lines.length < 2) throw new Error("Journal ต้องมีอย่างน้อย 2 บรรทัด");
  if (input.lines.some((line) => !line.account_id || (line.debit <= 0 && line.credit <= 0) || (line.debit > 0 && line.credit > 0))) {
    throw new Error("กรุณาตรวจสอบบัญชี Debit และ Credit");
  }

  const debitTotal = input.lines.reduce((sum, line) => sum + line.debit, 0);
  const creditTotal = input.lines.reduce((sum, line) => sum + line.credit, 0);
  if (Math.round(debitTotal * 100) !== Math.round(creditTotal * 100)) {
    throw new Error("ยอด Debit และ Credit ต้องเท่ากัน");
  }

  return input;
}
