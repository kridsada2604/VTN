import { PageHeader } from "@/components/page-header";
import { getUserManagement } from "@/lib/services/system/user-service";
import { saveUserMembership } from "./actions";

export default async function UsersPage() {
  const { users, roles, branches } = await getUserManagement();
  const activeBranches = branches.filter((branch) => branch.is_active);

  return (
    <div>
      <PageHeader eyebrow="SYSTEM" title="??????????????????" description="??????????? ???? ?????????????????????????????????" />
      <section className="card table-wrap mt-6">
        <table className="data-table">
          <thead>
            <tr>
              <th>????</th>
              <th>?????</th>
              <th>?????</th>
              <th>????</th>
              <th>?????</th>
              <th>?????????????</th>
              <th>??????</th>
            </tr>
          </thead>
          <tbody>
            {users.map((row) => {
              const profile = row.profiles?.[0];
              const role = row.roles?.[0];
              const branch = row.branches?.[0];

              return (
                <tr key={row.id}>
                  <td className="font-bold">{profile?.full_name || "-"}</td>
                  <td>{profile?.email ?? "-"}</td>
                  <td><span className="status-badge status-active">{role?.name ?? role?.code ?? "-"}</span></td>
                  <td>{branch ? branch.code + " - " + branch.name : "???????"}</td>
                  <td>{profile?.is_active ? "??????" : "?????????"}</td>
                  <td>{new Date(row.created_at).toLocaleDateString("th-TH")}</td>
                  <td>
                    <form action={saveUserMembership} className="flex min-w-[360px] flex-wrap gap-2">
                      <input type="hidden" name="membership_id" value={row.id} />
                      <select className="input min-w-28" name="role_id" defaultValue={row.role_id} aria-label="?????">
                        {roles.map((option) => (
                          <option key={option.id} value={option.id}>{option.name}</option>
                        ))}
                      </select>
                      <select className="input min-w-32" name="branch_id" defaultValue={row.branch_id ?? ""} aria-label="????">
                        <option value="">???????</option>
                        {activeBranches.map((option) => (
                          <option key={option.id} value={option.id}>{option.code} - {option.name}</option>
                        ))}
                      </select>
                      <select className="input min-w-28" name="is_active" defaultValue={String(profile?.is_active ?? true)} aria-label="??????????">
                        <option value="true">??????</option>
                        <option value="false">?????????</option>
                      </select>
                      <button className="btn-secondary btn-small">??????</button>
                    </form>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!users.length && <p className="p-6 text-gray-500">????????????????????????????</p>}
      </section>
    </div>
  );
}
