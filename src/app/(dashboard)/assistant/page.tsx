import { AgentChat } from "@/components/ai/agent-chat";
import { TeAriaBadge } from "@/components/ai/te-aria-badge";

export default function AssistantPage() {
  return (
    <div className="flex flex-col h-[calc(100vh-7rem)]">
      <div className="mb-4">
        <TeAriaBadge size="lg" />
        <p className="text-muted-foreground mt-1">
          AI Research & Insights Assistant — ask about your portfolio, options, market conditions, or any stock.
        </p>
      </div>
      <div className="flex-1 rounded-xl border overflow-hidden">
        <AgentChat placeholder="Ask ARIA anything about markets, stocks, or your portfolio..." />
      </div>
    </div>
  );
}
