export type CreateClaimInput = {
  customer_id: string | null;
  product_id: string | null;
  claim_date: string;
  claim_type: string;
  priority: string;
  subject: string;
  description: string | null;
};

const text = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();

export function parseClaimForm(fd: FormData): CreateClaimInput {
  const input: CreateClaimInput = {
    customer_id: text(fd, "customer_id") || null,
    product_id: text(fd, "product_id") || null,
    claim_date: text(fd, "claim_date"),
    claim_type: text(fd, "claim_type") || "PRODUCT",
    priority: text(fd, "priority") || "NORMAL",
    subject: text(fd, "subject"),
    description: text(fd, "description") || null,
  };

  if (!input.claim_date) throw new Error("กรุณาระบุวันที่เคลม");
  if (!input.subject) throw new Error("กรุณาระบุหัวข้อเคลม");
  return input;
}
