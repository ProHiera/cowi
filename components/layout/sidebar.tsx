"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

const NAV_ITEMS = [
  { href: "/", label: "Home" },
  { href: "/wizard", label: "Onboarding" },
  { href: "/console", label: "Console" },
  { href: "/studio", label: "Prompt Studio" },
  { href: "/project", label: "Projects" },
  { href: "/room", label: "Rooms" },
  { href: "/prompts", label: "Prompts" },
  { href: "/agent", label: "Agent" },
];

export function Sidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <aside className="hidden border-r bg-sidebar text-sidebar-foreground md:flex md:w-64 md:flex-col">
      <div className="px-6 py-4">
        <Link href="/" className="flex flex-col gap-1">
          <span className="text-xs uppercase tracking-[0.28em] text-muted-foreground">
            combo wizard
          </span>
          <span className="text-xl font-semibold">Deploy Flow OS</span>
        </Link>
      </div>
      <Separator />
      <ScrollArea className="flex-1 px-4 py-6">
        <div className="space-y-6">
          <nav className="space-y-1 text-sm">
            {NAV_ITEMS.map((item) => {
              const matches = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center justify-between rounded-md px-3 py-2 transition",
                    matches ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <span>{item.label}</span>
                  {matches && <Badge variant="secondary">active</Badge>}
                </Link>
              );
            })}
          </nav>
          <div className="rounded-lg border border-dashed p-4 text-xs text-muted-foreground">
            Ready for a live deployment? Configure Supabase keys in <code>.env.local</code> and hit “Deploy to Vercel”.
          </div>
        </div>
      </ScrollArea>
      <div className="border-t p-4">
        <Button asChild variant="secondary" className="w-full">
          <Link href={`/studio${searchParams.size ? `?${searchParams.toString()}` : ""}`}>
            Resume Flow
          </Link>
        </Button>
      </div>
    </aside>
  );
}
