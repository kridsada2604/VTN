export type CreateProjectInput = {
  customer_id: string | null;
  name: string;
  start_date: string | null;
  end_date: string | null;
  budget_amount: number;
  notes: string | null;
};

export type CreateProjectTaskInput = {
  project_id: string;
  title: string;
  due_date: string | null;
  estimated_hours: number;
  sort_order: number;
};

export type UpdateProjectTaskInput = {
  project_id: string;
  task_id: string;
  status: string;
  due_date: string | null;
  estimated_hours: number;
  actual_hours: number;
};

const text = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();

const numberOrZero = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export function parseProjectForm(fd: FormData): CreateProjectInput {
  const input: CreateProjectInput = {
    customer_id: text(fd, "customer_id") || null,
    name: text(fd, "name"),
    start_date: text(fd, "start_date") || null,
    end_date: text(fd, "end_date") || null,
    budget_amount: numberOrZero(fd.get("budget_amount")),
    notes: text(fd, "notes") || null,
  };

  if (!input.name) throw new Error("Project name is required");
  if (input.budget_amount < 0) throw new Error("Budget must not be negative");
  return input;
}

export function parseProjectTaskForm(fd: FormData): CreateProjectTaskInput {
  const input: CreateProjectTaskInput = {
    project_id: text(fd, "project_id"),
    title: text(fd, "title"),
    due_date: text(fd, "due_date") || null,
    estimated_hours: numberOrZero(fd.get("estimated_hours")),
    sort_order: numberOrZero(fd.get("sort_order")),
  };

  if (!input.project_id) throw new Error("Project is required");
  if (!input.title) throw new Error("Task title is required");
  if (input.estimated_hours < 0) throw new Error("Estimated hours must not be negative");
  return input;
}

export function parseProjectTaskUpdateForm(fd: FormData): UpdateProjectTaskInput {
  const input: UpdateProjectTaskInput = {
    project_id: text(fd, "project_id"),
    task_id: text(fd, "task_id"),
    status: text(fd, "status") || "TODO",
    due_date: text(fd, "due_date") || null,
    estimated_hours: numberOrZero(fd.get("estimated_hours")),
    actual_hours: numberOrZero(fd.get("actual_hours")),
  };

  if (!input.project_id) throw new Error("Project is required");
  if (!input.task_id) throw new Error("Task is required");
  if (input.estimated_hours < 0 || input.actual_hours < 0) throw new Error("Task hours must not be negative");
  return input;
}
