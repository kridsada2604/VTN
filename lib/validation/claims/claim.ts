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

export type CreateClaimResolutionInput = {
  claim_id: string;
  action_type: string;
  warehouse_id: string | null;
  product_id: string | null;
  quantity: number;
  amount: number;
  notes: string | null;
};

const text = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();

const numberOrZero = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

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

export function parseClaimResolutionForm(fd: FormData): CreateClaimResolutionInput {
  const input: CreateClaimResolutionInput = {
    claim_id: text(fd, "claim_id"),
    action_type: text(fd, "action_type") || "REPLACEMENT",
    warehouse_id: text(fd, "warehouse_id") || null,
    product_id: text(fd, "product_id") || null,
    quantity: numberOrZero(fd.get("quantity")),
    amount: numberOrZero(fd.get("amount")),
    notes: text(fd, "notes") || null,
  };

  if (!input.claim_id) throw new Error("Claim is required");
  if (!["REPLACEMENT", "REFUND", "CREDIT_NOTE"].includes(input.action_type)) throw new Error("Invalid claim resolution action");
  if (input.action_type === "REPLACEMENT" && (!input.warehouse_id || !input.product_id || input.quantity <= 0)) {
    throw new Error("Replacement requires warehouse, product, and quantity");
  }
  if ((input.action_type === "REFUND" || input.action_type === "CREDIT_NOTE") && input.amount <= 0) {
    throw new Error("Refund or credit note amount must be greater than zero");
  }
  return input;
}
