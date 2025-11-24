"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const SECONDARY_LINKS = [
  { label: "Docs", href: "https://supabase.com/docs" },
  { label: "Vercel", href: "https://vercel.com" },
];

export function TopNav() {
  const pathname = usePathname();

  return (
    <header className="flex h-16 items-center justify-between border-b bg-background px-4">
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <span className="font-medium text-foreground">Flow</span>
        <Separator orientation="vertical" className="h-6" />
        <span className="capitalize">{pathname === "/" ? "Combos" : pathname.replace("/", "").split("/")[0]}</span>
      </div>
      <div className="flex items-center gap-2">
        {SECONDARY_LINKS.map((link) => (
          <Button key={link.href} variant="ghost" size="sm" asChild className="text-xs">
            <Link href={link.href} target="_blank" rel="noreferrer">
              {link.label}
            </Link>
          </Button>
        ))}
        <Button size="sm" className="font-semibold">
          Launch deployment
        </Button>
      </div>
    </header>
  );
}
