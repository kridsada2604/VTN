import Link from "next/link";
import { AiConversationForm } from "@/components/ai/ai-conversation-form";
import { PageHeader } from "@/components/page-header";
import { getAiDashboard } from "@/lib/services/ai/ai-service";
import { createAiActionRequestFromForm, generateAiRecommendationQueue, reviewAiActionRequestFromForm, startAiConversation } from "./actions";

const priorityClass: Record<string, string> = {
  URGENT: "text-red-700",
  HIGH: "text-orange-700",
  NORMAL: "text-slate-700",
  LOW: "text-gray-500",
};

export default async function Page() {
  const { conversations, suggestions, actionRequests, insights, summary } = await getAiDashboard();

  return (
    <div>
      <PageHeader
        eyebrow="AI ASSISTANT"
        title="AI Assistant"
        description="ERP assistant for operational summary, insight review, and action recommendations."
      />
      <section className="mt-6 grid gap-6 xl:grid-cols-[1fr_420px]">
        <div className="space-y-6">
          <section className="card p-5">
            <p className="text-xs font-bold text-orange-600">AI DASHBOARD SUMMARY</p>
            <h2 className="mt-2 text-xl font-black">{summary.headline}</h2>
            <p className="mt-2 text-sm text-gray-600">{summary.summary}</p>
            {!!summary.focusAreas.length && (
              <div className="mt-4 flex flex-wrap gap-2">
                {summary.focusAreas.map((area) => (
                  <span key={area} className="rounded-full bg-orange-50 px-3 py-1 text-xs font-bold text-orange-700">{area}</span>
                ))}
              </div>
            )}
            <form action={generateAiRecommendationQueue} className="mt-4">
              <button className="btn-primary">Generate Suggestions</button>
            </form>
          </section>

          <section className="grid gap-4 md:grid-cols-2">
            {insights.map((insight) => (
              <div key={`${insight.module}-${insight.title}`} className="card p-5">
                <p className="text-xs font-bold text-orange-600">{insight.module}</p>
                <h2 className="mt-2 font-black">{insight.title}</h2>
                <p className="mt-2 text-sm text-gray-600">{insight.description}</p>
                <p className={`mt-3 text-xs font-bold ${priorityClass[insight.priority] ?? "text-slate-700"}`}>{insight.priority}</p>
              </div>
            ))}
          </section>

          <section className="card table-wrap">
            <div className="border-b p-4"><h2 className="font-black">Conversations</h2></div>
            <table className="data-table">
              <thead><tr><th>Title</th><th>Scope</th><th>Status</th><th>Updated</th><th /></tr></thead>
              <tbody>
                {conversations.map((conversation) => (
                  <tr key={conversation.id}>
                    <td className="font-bold">{conversation.title}</td>
                    <td>{conversation.context_scope}</td>
                    <td>{conversation.status}</td>
                    <td>{conversation.updated_at}</td>
                    <td><Link className="btn-secondary btn-small" href={`/ai/conversations/${conversation.id}`}>Open</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!conversations.length && <p className="p-6 text-gray-500">No AI conversations yet.</p>}
          </section>

          <section className="card table-wrap">
            <div className="border-b p-4"><h2 className="font-black">Suggestion Queue</h2></div>
            <table className="data-table">
              <thead><tr><th>Module</th><th>Title</th><th>Priority</th><th>Status</th></tr></thead>
              <tbody>
                {suggestions.map((suggestion) => (
                  <tr key={suggestion.id}>
                    <td>{suggestion.module}</td>
                    <td><b>{suggestion.title}</b><p className="text-xs text-gray-500">{suggestion.description}</p></td>
                    <td>{suggestion.priority}</td>
                    <td>{suggestion.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!suggestions.length && <p className="p-6 text-gray-500">No saved suggestions yet.</p>}
          </section>

          <section className="card table-wrap">
            <div className="border-b p-4"><h2 className="font-black">AI Action Approval Queue</h2></div>
            <table className="data-table">
              <thead><tr><th>Action</th><th>Module</th><th>Status</th><th>Review</th></tr></thead>
              <tbody>
                {actionRequests.map((request) => (
                  <tr key={request.id}>
                    <td>
                      <b>{request.title}</b>
                      <p className="text-xs text-gray-500">{request.description}</p>
                      <p className="mt-1 text-xs text-gray-400">{request.action_type} / {request.created_at}</p>
                    </td>
                    <td>{request.module}</td>
                    <td>{request.status}</td>
                    <td>
                      {request.status === "PENDING" ? (
                        <div className="flex flex-wrap gap-2">
                          <form action={reviewAiActionRequestFromForm}>
                            <input type="hidden" name="action_request_id" value={request.id} />
                            <input type="hidden" name="decision" value="APPROVED" />
                            <button className="btn-primary btn-small">Approve</button>
                          </form>
                          <form action={reviewAiActionRequestFromForm}>
                            <input type="hidden" name="action_request_id" value={request.id} />
                            <input type="hidden" name="decision" value="REJECTED" />
                            <button className="btn-secondary btn-small">Reject</button>
                          </form>
                        </div>
                      ) : (
                        <p className="text-xs text-gray-500">{request.review_note ?? request.reviewed_at ?? "-"}</p>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!actionRequests.length && <p className="p-6 text-gray-500">No AI action requests yet.</p>}
          </section>
        </div>

        <div className="space-y-6">
          <AiConversationForm action={startAiConversation} />
          <section className="card p-5">
            <h2 className="font-black">Create Action Request</h2>
            <form action={createAiActionRequestFromForm} className="mt-4 space-y-3">
              <select className="input" name="module" defaultValue="SYSTEM">
                <option value="SALES">Sales</option>
                <option value="INVENTORY">Inventory</option>
                <option value="ACCOUNTING">Accounting</option>
                <option value="PURCHASE">Purchase</option>
                <option value="CRM">CRM</option>
                <option value="PROJECTS">Projects</option>
                <option value="CLAIMS">Claims</option>
                <option value="POS">POS</option>
                <option value="MARKETPLACE">Marketplace</option>
                <option value="SYSTEM">System</option>
              </select>
              <input className="input" name="action_type" placeholder="Action type เช่น CREATE_TASK" />
              <input className="input" name="title" placeholder="Action title" required />
              <textarea className="input textarea" name="description" placeholder="What should be reviewed before execution?" required />
              <textarea className="input textarea font-mono text-xs" name="payload" placeholder='{"target":"invoice","risk":"low"}' />
              <button className="btn-primary">Queue for Review</button>
            </form>
          </section>
        </div>
      </section>
    </div>
  );
}
