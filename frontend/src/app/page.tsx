import { SiteHeader } from "@/components/site-header";
import { ChatPanel } from "@/components/chat/chat-panel";
import { MarketPanel } from "@/components/market/market-panel";
import { Toaster } from "@/components/ui/sonner";

export default function Home() {
  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground lg:h-dvh lg:overflow-hidden">
      <SiteHeader />

      {/*
        Split workspace: assistant on the left, market dashboard on the right.
        Each half scrolls independently on lg+; below that they stack and the
        page scrolls as one column.
      */}
      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-2 lg:divide-x">
        <section
          aria-label="Assistant"
          className="flex h-[70dvh] min-h-0 flex-col border-b lg:h-auto lg:border-b-0"
        >
          <ChatPanel />
        </section>

        <section
          aria-label="Market overview"
          className="min-h-0 bg-muted/30 lg:overflow-y-auto"
        >
          <MarketPanel />
        </section>
      </div>

      <Toaster />
    </div>
  );
}
