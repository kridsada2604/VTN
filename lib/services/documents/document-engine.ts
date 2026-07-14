type InvoiceEmailInput = {
  documentNo: string;
  customerName: string;
  customerEmail: string | null;
  totalAmount: number;
  balanceAmount: number;
};

export function formatDocumentMoney(value: number | string) {
  return Number(value).toLocaleString("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function createInvoiceEmailDraft(input: InvoiceEmailInput) {
  const subject = `Invoice ${input.documentNo} from VTN Business`;
  const body = [
    `เรียน ${input.customerName}`,
    "",
    `ขอนำส่งใบแจ้งหนี้เลขที่ ${input.documentNo}`,
    `ยอดรวม ${formatDocumentMoney(input.totalAmount)} บาท`,
    `ยอดคงค้าง ${formatDocumentMoney(input.balanceAmount)} บาท`,
    "",
    "ขอบคุณครับ/ค่ะ",
    "VTN Business",
  ].join("\n");

  const params = new URLSearchParams({ subject, body });
  return `mailto:${input.customerEmail ?? ""}?${params.toString()}`;
}
