import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createSupabaseServerClient } from "@/lib/supabase/server-client";

export default async function ProjectsIndex() {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase.from("projects").select("*").order("updated_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Projects</h1>
        <p className="text-muted-foreground">Drafts live here after you pick a combo.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {data?.map((project) => (
          <Card key={project.id}>
            <CardHeader>
              <CardTitle>{project.title}</CardTitle>
              <CardDescription>{project.combo_type}</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Status: {project.status}</p>
              <Link className="text-sm font-semibold text-primary" href={`/project/${project.id}`}>
                Open →
              </Link>
            </CardContent>
          </Card>
        ))}
        {!data?.length && <p className="text-muted-foreground">Create a combo to see it here.</p>}
      </div>
    </div>
  );
}
