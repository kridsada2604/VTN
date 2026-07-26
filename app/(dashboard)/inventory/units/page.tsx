import Link from "next/link";
import { FormCard } from "@/components/master-data/form-card";
import { StatusBadge } from "@/components/master-data/status-badge";
import { PageHeader } from "@/components/page-header";
import { getInventoryMasterRows } from "@/lib/services/inventory/inventory-master-service";
import { saveUnit, toggleUnit } from "./actions";

export default async function Page({ searchParams }: { searchParams: Promise<{ edit?: string }> }) {
  const { edit = "" } = await searchParams;
  const rows = await getInventoryMasterRows("unit");
  const editing = edit ? rows.find((row) => row.id === edit) : undefined;

  return (
    <div>
      <PageHeader eyebrow="INVENTORY" title="????????" description="????????????????????????" />
      <div className="two-column-page mt-6">
        <section className="card table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>????</th>
                <th>?????????</th>
                <th>?????</th>
                <th>??????</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className="font-bold">{row.code}</td>
                  <td>{row.name}</td>
                  <td><StatusBadge active={row.is_active} /></td>
                  <td>
                    <div className="action-row">
                      <Link className="btn-secondary btn-small" href={"/inventory/units?edit=" + row.id}>?????</Link>
                      <form action={toggleUnit}>
                        <input type="hidden" name="id" value={row.id} />
                        <input type="hidden" name="next" value={String(!row.is_active)} />
                        <button className="btn-secondary btn-small">{row.is_active ? "???" : "????"}</button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <FormCard title={editing ? "?????????????" : "?????????????"}>
          <form action={saveUnit} className="form-grid">
            <input type="hidden" name="id" value={editing?.id ?? ""} />
            <label>
              <span className="label">???? *</span>
              <input className="input" name="code" required defaultValue={editing?.code} />
            </label>
            <label>
              <span className="label">????????? *</span>
              <input className="input" name="name" required defaultValue={editing?.name} />
            </label>
            <div className="full action-row">
              <button className="btn-primary">??????</button>
              {editing && <Link className="btn-secondary" href="/inventory/units">??????</Link>}
            </div>
          </form>
        </FormCard>
      </div>
    </div>
  );
}
