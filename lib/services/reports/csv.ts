export type CsvRow = Record<string, string>;

export function parseCsv(text: string): CsvRow[] {
  const rows: string[][] = [];
  let current = "";
  let row: string[] = [];
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"' && quoted && next === '"') {
      current += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(current.trim());
      current = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(current.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      current = "";
    } else {
      current += char;
    }
  }

  row.push(current.trim());
  if (row.some(Boolean)) rows.push(row);
  if (!rows.length) return [];

  const headers = rows[0].map((header) => header.trim().toLowerCase());
  return rows.slice(1).map((values) =>
    Object.fromEntries(headers.map((header, index) => [header, values[index]?.trim() ?? ""])),
  );
}

export function numberFromRow(row: CsvRow, key: string) {
  const parsed = Number((row[key] ?? "0").replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

export function findDealerId(sourceName: string, rowDealerCode: string | undefined, dealers: Array<{ id: string; code: string; name: string }>) {
  const search = (rowDealerCode || sourceName).trim().toLowerCase();
  return dealers.find((dealer) => dealer.code.toLowerCase() === search || dealer.name.toLowerCase() === search)?.id ?? null;
}

export function findSalespersonId(email: string | undefined, salespeople: Array<{ user_id: string; profiles: { full_name: string | null; email: string | null }[] | null }>) {
  const search = email?.trim().toLowerCase();
  if (!search) return null;
  return salespeople.find((person) => person.profiles?.[0]?.email?.toLowerCase() === search)?.user_id ?? null;
}
