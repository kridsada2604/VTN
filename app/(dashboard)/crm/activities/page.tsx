import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { getCrmDashboard } from "@/lib/services/crm/crm-service";
import { completeActivityAction, saveActivity } from "../actions";

const activityTypeLabel: Record<string, string> = {
  CALL: "Call",
  EMAIL: "Email",
  MEETING: "Meeting",
  TASK: "Task",
  NOTE: "Note",
};

export default async function Page() {
  const { activities, leads, opportunities } = await getCrmDashboard();

  return (
    <div>
      <PageHeader
        eyebrow="CRM"
        title="Activities"
        description="Calls, emails, meetings, tasks, and notes for CRM follow-up"
        action={<Link className="btn-secondary" href="/crm">Back to CRM</Link>}
      />

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_380px]">
        <section className="card table-wrap">
          <table className="data-table">
            <thead><tr><th>Type</th><th>Subject</th><th>Due</th><th>Status</th><th>Notes</th><th>Action</th></tr></thead>
            <tbody>
              {activities.map((activity) => (
                <tr key={activity.id}>
                  <td>{activityTypeLabel[activity.activity_type] ?? activity.activity_type}</td>
                  <td className="font-bold">{activity.subject}</td>
                  <td>{activity.due_at ? new Date(activity.due_at).toLocaleString("th-TH") : "-"}</td>
                  <td>{activity.completed_at ? "Done" : "Open"}</td>
                  <td>{activity.notes ?? "-"}</td>
                  <td>
                    {activity.completed_at ? (
                      <span className="text-sm text-green-700">Completed</span>
                    ) : (
                      <form action={completeActivityAction}>
                        <input type="hidden" name="activity_id" value={activity.id} />
                        <input type="hidden" name="redirect_to" value="/crm/activities" />
                        <button className="btn-secondary btn-small">Complete</button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!activities.length && <p className="p-6 text-gray-500">No activities yet.</p>}
        </section>

        <aside className="card p-5">
          <h2 className="font-black">New Activity</h2>
          <form action={saveActivity} className="mt-4 space-y-3">
            <input type="hidden" name="redirect_to" value="/crm/activities" />
            <label>
              <span className="label">Lead</span>
              <select className="input" name="lead_id" defaultValue="">
                <option value="">No lead</option>
                {leads.map((lead) => <option key={lead.id} value={lead.id}>{lead.lead_no} - {lead.name}</option>)}
              </select>
            </label>
            <label>
              <span className="label">Opportunity</span>
              <select className="input" name="opportunity_id" defaultValue="">
                <option value="">No opportunity</option>
                {opportunities.map((opportunity) => <option key={opportunity.id} value={opportunity.id}>{opportunity.title}</option>)}
              </select>
            </label>
            <label>
              <span className="label">Type</span>
              <select className="input" name="activity_type" defaultValue="TASK">
                {Object.entries(activityTypeLabel).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
            <label><span className="label">Subject</span><input className="input" name="subject" required /></label>
            <label><span className="label">Due</span><input className="input" type="datetime-local" name="due_at" /></label>
            <label><span className="label">Notes</span><textarea className="input textarea" name="notes" /></label>
            <button className="btn-primary w-full">Create Activity</button>
          </form>
        </aside>
      </div>
    </div>
  );
}
