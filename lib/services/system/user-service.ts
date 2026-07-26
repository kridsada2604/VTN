import { getCurrentCompanyId } from "@/lib/current-company";
import { UserRepository } from "@/lib/repositories/system/user-repository";
import { createClient } from "@/lib/supabase/server";
import type { UpdateUserMembershipInput } from "@/lib/validation/system/user";

async function getRepository() {
  const supabase = await createClient();
  const companyId = await getCurrentCompanyId();
  return { companyId, repository: new UserRepository(supabase) };
}

export async function getCompanyUsers() {
  const { companyId, repository } = await getRepository();
  return repository.listCompanyUsers(companyId);
}

export async function getUserManagement() {
  const { companyId, repository } = await getRepository();
  const [users, roles, branches] = await Promise.all([
    repository.listCompanyUsers(companyId),
    repository.listRoles(),
    repository.listBranches(companyId),
  ]);

  return { users, roles, branches };
}

export async function updateUserMembership(input: UpdateUserMembershipInput) {
  const { companyId, repository } = await getRepository();
  return repository.updateMembership(companyId, input);
}
