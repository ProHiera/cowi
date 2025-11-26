import { PromptLibraryManager } from "@/components/prompt-library/prompt-library-manager";
import {
  getPromptRecommendations,
  listPromptLibraryEntries,
  listPromptUsageLogs,
} from "@/lib/data/prompt-library";
import type { ComboType } from "@/lib/types";

interface PromptsPageProps {
  searchParams: { tag?: string; combo?: string };
}

export default async function PromptsPage({ searchParams }: PromptsPageProps) {
  const comboType = isComboType(searchParams.combo) ? searchParams.combo : undefined;
  const [prompts, recommendations, usageLogs] = await Promise.all([
    listPromptLibraryEntries({ tag: searchParams.tag, includeShared: true }),
    getPromptRecommendations({ comboType, tags: searchParams.tag ? [searchParams.tag] : undefined }),
    listPromptUsageLogs({ limit: 20 }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Prompt library</h1>
        <p className="text-muted-foreground">
          Save personal prompts, reuse them across combos, and log where they&apos;re applied.
        </p>
      </div>
      <PromptLibraryManager
        initialPrompts={prompts}
        recommendations={recommendations}
        usageLogs={usageLogs}
        comboType={comboType}
      />
    </div>
  );
}

function isComboType(value?: string): value is ComboType {
  if (!value) return false;
  return ["enterprise", "web", "app", "custom"].includes(value);
}
