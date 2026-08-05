import Link from "next/link";
import { CandlestickChart } from "lucide-react";

import { BRAND } from "@/lib/brand";
import { AuthNav } from "@/components/auth-nav";

export function SiteHeader() {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b px-4 sm:px-6">
      <Link href="/" className="flex items-center gap-2">
        <span className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <CandlestickChart className="size-4" />
        </span>
        <span className="font-heading text-base font-semibold tracking-tight">
          {BRAND.name}
        </span>
      </Link>
      <AuthNav />
    </header>
  );
}
