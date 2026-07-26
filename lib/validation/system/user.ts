export type UpdateUserMembershipInput = {
  membership_id: string;
  role_id: string;
  branch_id: string | null;
  is_active: boolean;
};

const text = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();

export function parseUpdateUserMembershipForm(fd: FormData): UpdateUserMembershipInput {
  const input = {
    membership_id: text(fd, "membership_id"),
    role_id: text(fd, "role_id"),
    branch_id: text(fd, "branch_id") || null,
    is_active: text(fd, "is_active") === "true",
  };

  if (!input.membership_id) throw new Error("User membership is required");
  if (!input.role_id) throw new Error("User role is required");
  return input;
}
