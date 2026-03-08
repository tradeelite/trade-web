import { AgentChat } from "@/components/ai/agent-chat";

export default function AssistantPage() {
  return (
    <div className="flex flex-col h-[calc(100vh-7rem)]">
      <div className="mb-4">
        <h1 className="text-3xl font-bold">AI Assistant</h1>
        <p className="text-muted-foreground">
          Ask about your portfolio, open positions, market conditions, or any stock.
        </p>
      </div>
      <div className="flex-1 rounded-xl border overflow-hidden">
        <AgentChat />
      </div>
    </div>
  );
}
