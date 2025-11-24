import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { listPromptTemplates } from "@/lib/data/prompt-templates";

interface PromptsPageProps {
  searchParams: { tag?: string };
}

export default async function PromptsPage({ searchParams }: PromptsPageProps) {
  const templates = await listPromptTemplates(searchParams.tag);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Prompt library</h1>
        <p className="text-muted-foreground">Filter by tag and push templates directly to the studio.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {templates.map((template) => (
          <Card key={template.id} className="flex flex-col">
            <CardHeader>
              <CardTitle className="text-lg">{template.title}</CardTitle>
              <CardDescription>{template.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col justify-between gap-4">
              <p className="text-sm text-muted-foreground line-clamp-3">{template.content}</p>
              <div className="flex flex-wrap gap-1">
                {template.tags?.map((tag: string) => (
                  <Badge key={tag} variant="secondary" className="capitalize">
                    {tag}
                  </Badge>
                ))}
              </div>
              <div className="text-right text-sm">
                <Link href={`/studio?template=${template.id}`} className="font-semibold text-primary">
                  Load in studio →
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
