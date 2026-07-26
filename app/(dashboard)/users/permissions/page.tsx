import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { getPermissionMatrix } from "@/lib/services/system/permission-service";
import { saveRolePermission } from "./actions";

export default async function PermissionMatrixPage() {
  const { modules, actions, roles } = await getPermissionMatrix();

  return (
    <div>
      <PageHeader eyebrow="SYSTEM" title="Permission Matrix" description="Manage module and action permissions by role." />
      <div className="mt-4 flex flex-wrap gap-2">
        <Link className="btn-secondary btn-small" href="/users">Back to users</Link>
      </div>
      <section className="card table-wrap mt-6">
        <table className="data-table">
          <thead>
            <tr>
              <th>Role</th>
              <th>Module</th>
              {actions.map((action) => <th key={action.key}>{action.label}</th>)}
            </tr>
          </thead>
          <tbody>
            {roles.flatMap((role) => modules.map((module, moduleIndex) => (
              <tr key={role.id + module.key}>
                {moduleIndex === 0 && (
                  <td className="font-bold align-top" rowSpan={modules.length}>
                    <div>{role.name}</div>
                    <div className="mt-1 text-xs font-normal text-gray-500">{role.code}</div>
                  </td>
                )}
                <td className="font-bold">{module.label}</td>
                {actions.map((action) => {
                  const cell = role.cells.find((item) => item.module_key === module.key && item.action_key === action.key);
                  const isOwnerLocked = role.code === "OWNER";
                  const nextAllowed = !cell?.is_allowed;

                  return (
                    <td key={action.key}>
                      <form action={saveRolePermission}>
                        <input type="hidden" name="role_id" value={role.id} />
                        <input type="hidden" name="module_key" value={module.key} />
                        <input type="hidden" name="action_key" value={action.key} />
                        <input type="hidden" name="is_allowed" value={String(nextAllowed)} />
                        <button className={cell?.is_allowed ? "status-badge status-active" : "status-badge status-inactive"} disabled={isOwnerLocked} title={isOwnerLocked ? "Owner role always has full access" : "Toggle permission"}>
                          {cell?.is_allowed ? "Allowed" : "Blocked"}
                        </button>
                      </form>
                    </td>
                  );
                })}
              </tr>
            )))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
