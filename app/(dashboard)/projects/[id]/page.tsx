import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { formatDocumentMoney } from "@/lib/services/documents/document-engine";
import { getProjectDetail } from "@/lib/services/projects/project-service";
import { saveProjectTask, updateProjectTaskAction } from "../actions";

const statusLabel: Record<string, string> = {
  TODO: "To do",
  IN_PROGRESS: "In progress",
  DONE: "Done",
  BLOCKED: "Blocked",
};

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { project, tasks } = await getProjectDetail(id);
  if (!project) notFound();

  const completedTasks = tasks.filter((task) => task.status === "DONE").length;
  const progress = tasks.length ? Math.round((completedTasks / tasks.length) * 100) : 0;
  const nextSortOrder = tasks.length ? Math.max(...tasks.map((task) => Number(task.sort_order || 0))) + 10 : 10;

  return (
    <div>
      <PageHeader eyebrow="PROJECT" title={project.name} description={`${project.project_no} - ${project.status}`} />
      <div className="my-6"><Link className="btn-secondary" href="/projects">Back</Link></div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="card p-5"><p className="text-sm text-gray-500">Budget</p><p className="mt-2 text-3xl font-black">{formatDocumentMoney(project.budget_amount)}</p></div>
        <div className="card p-5"><p className="text-sm text-gray-500">Actual cost</p><p className="mt-2 text-3xl font-black text-orange-700">{formatDocumentMoney(project.actual_cost)}</p></div>
        <div className="card p-5"><p className="text-sm text-gray-500">Revenue</p><p className="mt-2 text-3xl font-black text-green-700">{formatDocumentMoney(project.revenue_amount)}</p></div>
        <div className="card p-5"><p className="text-sm text-gray-500">Task progress</p><p className="mt-2 text-3xl font-black">{progress}%</p></div>
      </section>

      <section className="mt-7 grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="card table-wrap">
          <div className="border-b p-4"><h2 className="font-black">Tasks</h2></div>
          <table className="data-table">
            <thead><tr><th>Task</th><th>Status</th><th>Due</th><th>Est.</th><th>Actual</th><th>Update</th></tr></thead>
            <tbody>
              {tasks.map((task) => (
                <tr key={task.id}>
                  <td className="font-bold">{task.title}</td>
                  <td>{statusLabel[task.status] ?? task.status}</td>
                  <td>{task.due_date ?? "-"}</td>
                  <td>{task.estimated_hours}</td>
                  <td>{task.actual_hours}</td>
                  <td>
                    <form action={updateProjectTaskAction} className="flex flex-wrap gap-2">
                      <input type="hidden" name="project_id" value={project.id} />
                      <input type="hidden" name="task_id" value={task.id} />
                      <select className="input min-w-32" name="status" defaultValue={task.status}>
                        {Object.entries(statusLabel).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                      </select>
                      <input className="input w-36" type="date" name="due_date" defaultValue={task.due_date ?? ""} />
                      <input className="input w-24" type="number" min="0" step="0.25" name="estimated_hours" defaultValue={Number(task.estimated_hours)} />
                      <input className="input w-24" type="number" min="0" step="0.25" name="actual_hours" defaultValue={Number(task.actual_hours)} />
                      <button className="btn-secondary btn-small">Save</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!tasks.length && <p className="p-6 text-gray-500">No tasks yet.</p>}
        </div>

        <aside className="card p-5">
          <h2 className="font-black">New Task</h2>
          <form action={saveProjectTask} className="mt-4 space-y-3">
            <input type="hidden" name="project_id" value={project.id} />
            <input type="hidden" name="sort_order" value={nextSortOrder} />
            <label><span className="label">Title</span><input className="input" name="title" required /></label>
            <label><span className="label">Due date</span><input className="input" type="date" name="due_date" /></label>
            <label><span className="label">Estimated hours</span><input className="input" type="number" min="0" step="0.25" name="estimated_hours" defaultValue="0" /></label>
            <button className="btn-primary w-full">Create Task</button>
          </form>

          {project.notes && (
            <div className="mt-6 rounded-xl bg-gray-50 p-4">
              <p className="text-xs font-bold text-gray-500">Notes</p>
              <p className="mt-1">{project.notes}</p>
            </div>
          )}
        </aside>
      </section>
    </div>
  );
}
