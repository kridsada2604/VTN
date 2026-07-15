export type CreateLeadInput = {
  name: string;
  company_name: string | null;
  email: string | null;
  phone: string | null;
  source: string | null;
  notes: string | null;
};

export type CreateOpportunityInput = {
  lead_id: string | null;
  customer_id: string | null;
  title: string;
  stage: string;
  expected_value: number;
  probability: number;
  expected_close_date: string | null;
  notes: string | null;
};

export type UpdateOpportunityStageInput = {
  opportunity_id: string;
  stage: string;
  probability: number;
};

export type CreateActivityInput = {
  lead_id: string | null;
  opportunity_id: string | null;
  activity_type: string;
  subject: string;
  due_at: string | null;
  notes: string | null;
};

const text = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();

const numberOrZero = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export function parseLeadForm(fd: FormData): CreateLeadInput {
  const input: CreateLeadInput = {
    name: text(fd, "name"),
    company_name: text(fd, "company_name") || null,
    email: text(fd, "email") || null,
    phone: text(fd, "phone") || null,
    source: text(fd, "source") || null,
    notes: text(fd, "notes") || null,
  };

  if (!input.name) throw new Error("Lead name is required");
  return input;
}

export function parseOpportunityForm(fd: FormData): CreateOpportunityInput {
  const input: CreateOpportunityInput = {
    lead_id: text(fd, "lead_id") || null,
    customer_id: text(fd, "customer_id") || null,
    title: text(fd, "title"),
    stage: text(fd, "stage") || "QUALIFY",
    expected_value: numberOrZero(fd.get("expected_value")),
    probability: numberOrZero(fd.get("probability")),
    expected_close_date: text(fd, "expected_close_date") || null,
    notes: text(fd, "notes") || null,
  };

  if (!input.title) throw new Error("Opportunity title is required");
  if (input.expected_value < 0) throw new Error("Expected value must not be negative");
  if (input.probability < 0 || input.probability > 100) throw new Error("Probability must be 0-100");
  return input;
}

export function parseOpportunityStageForm(fd: FormData): UpdateOpportunityStageInput {
  const input: UpdateOpportunityStageInput = {
    opportunity_id: text(fd, "opportunity_id"),
    stage: text(fd, "stage"),
    probability: numberOrZero(fd.get("probability")),
  };

  if (!input.opportunity_id) throw new Error("Opportunity is required");
  if (!input.stage) throw new Error("Stage is required");
  if (input.probability < 0 || input.probability > 100) throw new Error("Probability must be 0-100");
  return input;
}

export function parseActivityForm(fd: FormData): CreateActivityInput {
  const input: CreateActivityInput = {
    lead_id: text(fd, "lead_id") || null,
    opportunity_id: text(fd, "opportunity_id") || null,
    activity_type: text(fd, "activity_type") || "TASK",
    subject: text(fd, "subject"),
    due_at: text(fd, "due_at") || null,
    notes: text(fd, "notes") || null,
  };

  if (!input.subject) throw new Error("Activity subject is required");
  return input;
}
