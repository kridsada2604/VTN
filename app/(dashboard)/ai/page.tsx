import Link from "next/link";
import { AiConversationForm } from "@/components/ai/ai-conversation-form";
import { PageHeader } from "@/components/page-header";
import { getAiDashboard } from "@/lib/services/ai/ai-service";
import { startAiConversation } from "./actions";

const priorityClass: Record<string, string> = {
  URGENT: "text-red-700",
  HIGH: "text-orange-700",
  NORMAL: "text-slate-700",
  LOW: "text-gray-500",
};

export default async function Page() {
  const { conversations, suggestions, insights, summary } = await getAiDashboard();

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
        </div>

        <div>
          <AiConversationForm action={startAiConversation} />
        </div>
      </section>
    </div>
  );
}
