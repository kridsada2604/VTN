export type CreateClaimInput = {
  customer_id: string | null;
  product_id: string | null;
  claim_date: string;
  claim_type: string;
  priority: string;
  subject: string;
  description: string | null;
};

export type UpdateClaimStatusInput = {
  claim_id: string;
  status: string;
  resolution: string | null;
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

  if (!input.claim_date) throw new Error("Claim date is required");
  if (!input.subject) throw new Error("Claim subject is required");
  return input;
}

export function parseClaimStatusForm(fd: FormData): UpdateClaimStatusInput {
  const input: UpdateClaimStatusInput = {
    claim_id: text(fd, "claim_id"),
    status: text(fd, "status"),
    resolution: text(fd, "resolution") || null,
  };

  if (!input.claim_id) throw new Error("Claim is required");
  if (!input.status) throw new Error("Claim status is required");
  return input;
}
