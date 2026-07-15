import Link from "next/link";
import { Activity, BadgeDollarSign, UserRoundPlus, UsersRound } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { getCrmDashboard } from "@/lib/services/crm/crm-service";
import { formatDocumentMoney } from "@/lib/services/documents/document-engine";
import { completeActivityAction, convertLeadAction, saveActivity, saveOpportunity, saveOpportunityStage } from "./actions";

const statusLabel: Record<string, string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  QUALIFIED: "Qualified",
  CONVERTED: "Converted",
  LOST: "Lost",
};

const stageLabel: Record<string, string> = {
  QUALIFY: "Qualify",
  PROPOSE: "Propose",
  NEGOTIATE: "Negotiate",
  WON: "Won",
  LOST: "Lost",
};

const activityTypeLabel: Record<string, string> = {
  CALL: "Call",
  EMAIL: "Email",
  MEETING: "Meeting",
  TASK: "Task",
  NOTE: "Note",
};

const stageProbability: Record<string, number> = {
  QUALIFY: 20,
  PROPOSE: 50,
  NEGOTIATE: 75,
  WON: 100,
  LOST: 0,
};

export default async function Page() {
  const { leads, opportunities, activities, customers } = await getCrmDashboard();
  const openActivities = activities.filter((activity) => !activity.completed_at);
  const pipelineValue = opportunities.reduce((sum, opportunity) => sum + Number(opportunity.expected_value || 0), 0);

  return (
    <div>
      <PageHeader
        eyebrow="CRM"
        title="CRM"
        description="Lead, opportunity, activity, and customer conversion workflow"
        action={<Link className="btn-primary" href="/crm/leads/new">+ Add Lead</Link>}
      />

      <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="card p-5"><UsersRound className="text-orange-600" /><p className="mt-3 text-sm text-gray-500">Leads</p><p className="mt-2 text-3xl font-black">{leads.length}</p></div>
        <div className="card p-5"><BadgeDollarSign className="text-orange-600" /><p className="mt-3 text-sm text-gray-500">Opportunities</p><p className="mt-2 text-3xl font-black">{opportunities.length}</p></div>
        <div className="card p-5"><Activity className="text-orange-600" /><p className="mt-3 text-sm text-gray-500">Open Activities</p><p className="mt-2 text-3xl font-black">{openActivities.length}</p></div>
        <div className="card p-5"><UserRoundPlus className="text-orange-600" /><p className="mt-3 text-sm text-gray-500">Pipeline Value</p><p className="mt-2 text-3xl font-black text-green-700">{formatDocumentMoney(pipelineValue)}</p></div>
      </section>

      <section className="mt-7 grid gap-6 xl:grid-cols-[1.35fr_0.9fr]">
        <div className="card table-wrap">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4">
            <h2 className="font-black">Leads</h2>
            <Link className="btn-secondary btn-small" href="/crm/activities">Activities</Link>
          </div>
          <table className="data-table">
            <thead><tr><th>No.</th><th>Name</th><th>Company</th><th>Contact</th><th>Source</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id}>
                  <td className="font-bold">{lead.lead_no}</td>
                  <td>{lead.name}</td>
                  <td>{lead.company_name ?? "-"}</td>
                  <td>{lead.phone ?? lead.email ?? "-"}</td>
                  <td>{lead.source ?? "-"}</td>
                  <td>{statusLabel[lead.status] ?? lead.status}</td>
                  <td>
                    {lead.status === "CONVERTED" ? (
                      <span className="text-sm text-green-700">Converted</span>
                    ) : (
                      <form action={convertLeadAction}>
                        <input type="hidden" name="lead_id" value={lead.id} />
                        <button className="btn-secondary btn-small">Convert</button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!leads.length && <p className="p-6 text-gray-500">No leads yet.</p>}
        </div>

        <aside className="card p-5">
          <h2 className="font-black">New Opportunity</h2>
          <form action={saveOpportunity} className="mt-4 space-y-3">
            <label>
              <span className="label">Lead</span>
              <select className="input" name="lead_id" defaultValue="">
                <option value="">No lead</option>
                {leads.filter((lead) => lead.status !== "CONVERTED").map((lead) => <option key={lead.id} value={lead.id}>{lead.lead_no} - {lead.name}</option>)}
              </select>
            </label>
            <label>
              <span className="label">Customer</span>
              <select className="input" name="customer_id" defaultValue="">
                <option value="">No customer</option>
                {customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.code} - {customer.name}</option>)}
              </select>
            </label>
            <label><span className="label">Title</span><input className="input" name="title" required /></label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label><span className="label">Value</span><input className="input" type="number" min="0" step="0.01" name="expected_value" defaultValue="0" /></label>
              <label><span className="label">Probability</span><input className="input" type="number" min="0" max="100" step="1" name="probability" defaultValue="20" /></label>
            </div>
            <label>
              <span className="label">Stage</span>
              <select className="input" name="stage" defaultValue="QUALIFY">
                {Object.entries(stageLabel).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
            <label><span className="label">Expected close</span><input className="input" type="date" name="expected_close_date" /></label>
            <label><span className="label">Notes</span><textarea className="input textarea" name="notes" /></label>
            <button className="btn-primary w-full">Create Opportunity</button>
          </form>
        </aside>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1fr_420px]">
        <div className="card table-wrap">
          <div className="border-b p-4"><h2 className="font-black">Pipeline</h2></div>
          <table className="data-table">
            <thead><tr><th>Opportunity</th><th>Stage</th><th>Value</th><th>Probability</th><th>Close</th><th>Update</th></tr></thead>
            <tbody>
              {opportunities.map((opportunity) => (
                <tr key={opportunity.id}>
                  <td className="font-bold">{opportunity.title}</td>
                  <td>{stageLabel[opportunity.stage] ?? opportunity.stage}</td>
                  <td>{formatDocumentMoney(opportunity.expected_value)}</td>
                  <td>{opportunity.probability}%</td>
                  <td>{opportunity.expected_close_date ?? "-"}</td>
                  <td>
                    <form action={saveOpportunityStage} className="flex flex-wrap gap-2">
                      <input type="hidden" name="opportunity_id" value={opportunity.id} />
                      <select className="input min-w-32" name="stage" defaultValue={opportunity.stage}>
                        {Object.entries(stageLabel).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                      </select>
                      <select className="input w-24" name="probability" defaultValue={opportunity.probability}>
                        {Object.entries(stageProbability).map(([stage, probability]) => <option key={stage} value={probability}>{probability}%</option>)}
                      </select>
                      <button className="btn-secondary btn-small">Save</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!opportunities.length && <p className="p-6 text-gray-500">No opportunities yet.</p>}
        </div>

        <aside className="space-y-6">
          <section className="card p-5">
            <h2 className="font-black">New Activity</h2>
            <form action={saveActivity} className="mt-4 space-y-3">
              <input type="hidden" name="redirect_to" value="/crm" />
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
          </section>

          <section className="card p-5">
            <h2 className="font-black">Next Activities</h2>
            <div className="mt-4 space-y-3">
              {openActivities.slice(0, 8).map((activity) => (
                <div key={activity.id} className="rounded-xl border border-gray-200 p-3">
                  <p className="font-bold">{activity.subject}</p>
                  <p className="text-sm text-gray-500">{activityTypeLabel[activity.activity_type] ?? activity.activity_type} - {activity.due_at ? new Date(activity.due_at).toLocaleString("th-TH") : "No due date"}</p>
                  <form action={completeActivityAction} className="mt-3">
                    <input type="hidden" name="activity_id" value={activity.id} />
                    <input type="hidden" name="redirect_to" value="/crm" />
                    <button className="btn-secondary btn-small">Complete</button>
                  </form>
                </div>
              ))}
              {!openActivities.length && <p className="text-sm text-gray-500">No open activities.</p>}
            </div>
          </section>
        </aside>
      </section>
    </div>
  );
}
