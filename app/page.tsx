import { ComboCard } from "@/components/combo-card";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { COMBO_PRESETS } from "@/lib/constants";

export default function Home() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 rounded-2xl border bg-card/50 p-6 shadow-sm">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">Continuous flow</p>
          <h1 className="text-3xl font-semibold">Pick a deployment combo to kickstart your build</h1>
        </div>
        <p className="text-muted-foreground">
          Every combo still runs through our Next.js + Supabase + Vercel control plane. Enterprise and mobile
          architectures are surfaced as guidance for now.
        </p>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All combos</TabsTrigger>
          <TabsTrigger value="web">Web</TabsTrigger>
          <TabsTrigger value="app">App</TabsTrigger>
          <TabsTrigger value="custom">Custom</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="space-y-4">
          <ComboGrid filter="all" />
        </TabsContent>
        <TabsContent value="web" className="space-y-4">
          <ComboGrid filter="web" />
        </TabsContent>
        <TabsContent value="app" className="space-y-4">
          <ComboGrid filter="app" />
        </TabsContent>
        <TabsContent value="custom" className="space-y-4">
          <ComboGrid filter="custom" />
        </TabsContent>
      </Tabs>

      <Card>
        <CardContent className="space-y-2 p-6">
          <p className="text-sm font-medium">notion for devops</p>
          <p className="text-sm text-muted-foreground">
            Combo data persists in Supabase via the Projects API. Coming next: service to bootstrap GitHub repos and
            trigger Vercel deployments automatically.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function ComboGrid({ filter }: { filter: "all" | "web" | "app" | "custom" }) {
  const items = COMBO_PRESETS.filter((preset) => filter === "all" || preset.id === filter || preset.target === filter);

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {items.map((preset) => (
        <ComboCard key={preset.id} preset={preset} />
      ))}
    </div>
  );
}
