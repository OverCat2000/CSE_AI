import { SiteHeader } from "@/components/site-header";
import { Toaster } from "@/components/ui/sonner";

export default function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />
      <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</div>
      <Toaster />
    </div>
  );
}
