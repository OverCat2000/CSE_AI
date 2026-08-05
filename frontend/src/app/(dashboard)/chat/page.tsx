import { ChatPanel } from "@/components/chat/chat-panel";

export const metadata = {
  title: "Assistant",
};

export default function ChatPage() {
  return (
    <div className="flex h-[calc(100dvh-7.5rem)] flex-col overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
      <ChatPanel />
    </div>
  );
}
