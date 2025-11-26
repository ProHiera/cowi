"use client";

import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { PromptRecommendation } from "@/lib/types";

interface RecommendationsRailProps {
  recommendations: PromptRecommendation[];
  onSave: (recommendation: PromptRecommendation) => Promise<unknown>;
  onApply: (recommendation: PromptRecommendation) => Promise<unknown>;
}

export function RecommendationsRail({ recommendations, onSave, onApply }: RecommendationsRailProps) {
  const [pendingId, setPendingId] = useState<string | null>(null);

  if (!recommendations.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Recommended prompts</CardTitle>
          <CardDescription>No recommendations yet. Run onboarding or add tags to see matches.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const handleAction = async (
    action: (recommendation: PromptRecommendation) => Promise<unknown>,
    recommendation: PromptRecommendation
  ) => {
    setPendingId(recommendation.id);
    try {
      await action(recommendation);
    } finally {
      setPendingId(null);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold">Recommended prompts</h3>
        <span className="text-xs text-muted-foreground">Curated from combo, tags, and usage</span>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {recommendations.map((recommendation) => (
          <Card key={recommendation.id} className="flex flex-col">
            <CardHeader>
              <CardTitle className="text-base font-semibold">{recommendation.title}</CardTitle>
              <CardDescription>{recommendation.summary ?? "No summary"}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col justify-between gap-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground line-clamp-3">{recommendation.content}</p>
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <Badge variant="outline">{recommendation.combo_type}</Badge>
                  <Badge variant={SOURCE_VARIANTS[recommendation.source]}>src: {recommendation.source}</Badge>
                  <span>{recommendation.reason}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  className="flex-1"
                  disabled={pendingId === recommendation.id}
                  onClick={() => handleAction(onSave, recommendation)}
                >
                  {pendingId === recommendation.id ? "Saving..." : "Save"}
                </Button>
                <Button
                  size="sm"
                  className="flex-1"
                  disabled={pendingId === recommendation.id}
                  onClick={() => handleAction(onApply, recommendation)}
                >
                  {pendingId === recommendation.id ? "Applying..." : "Apply"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

const SOURCE_VARIANTS: Record<PromptRecommendation["source"], "default" | "secondary" | "outline"> = {
  rule: "default",
  llm: "secondary",
  fallback: "outline",
};
