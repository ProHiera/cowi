"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PromptUsageLog } from "@/lib/types";

interface UsageInsightsProps {
  logs: PromptUsageLog[];
}

interface InsightRow {
  title: string;
  detail: string;
}

export function UsageInsights({ logs }: UsageInsightsProps) {
  const insights = buildInsights(logs);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">Optimization tips</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {insights.length === 0 ? (
          <p className="text-muted-foreground">
            No LLM usage logs yet. Apply prompts or run studio sessions to unlock optimization hints.
          </p>
        ) : (
          insights.map((insight) => (
            <div key={insight.title}>
              <p className="font-medium">{insight.title}</p>
              <p className="text-muted-foreground">{insight.detail}</p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function buildInsights(logs: PromptUsageLog[]): InsightRow[] {
  if (!logs.length) return [];

  const costTotals = logs.reduce(
    (acc, log) => {
      const cost = log.cost_usd ?? 0;
      acc.total += cost;
      if (log.provider) {
        acc.byProvider.set(log.provider, (acc.byProvider.get(log.provider) ?? 0) + cost);
      }
      if (log.combo_type) {
        acc.byCombo.set(log.combo_type, (acc.byCombo.get(log.combo_type) ?? 0) + (log.tokens_output ?? 0));
      }
      return acc;
    },
    { total: 0, byProvider: new Map<string, number>(), byCombo: new Map<string, number>() }
  );

  const tokensIn = sum(logs.map((log) => log.tokens_input ?? 0));
  const tokensOut = sum(logs.map((log) => log.tokens_output ?? 0));
  const totalRuns = logs.length;
  const insights: InsightRow[] = [];

  if (costTotals.total > 0) {
    const [topProvider, topProviderCost] = getTopEntry(costTotals.byProvider);
    insights.push({
      title: `Recent LLM spend $${costTotals.total.toFixed(2)}`,
      detail: topProvider
        ? `${capitalize(topProvider)} accounts for ${percent(topProviderCost, costTotals.total)} of costs. Consider downgrading the model or caching for that provider.`
        : "Track provider usage to spot runaway costs early.",
    });
  }

  if (tokensOut > 0) {
    const amplification = tokensIn > 0 ? tokensOut / Math.max(tokensIn, 1) : null;
    if (amplification && amplification > 3) {
      insights.push({
        title: "High expansion detected",
        detail: `Outputs are ${amplification.toFixed(1)}× longer than inputs on average. Consider trimming instructions or lowering max tokens to reduce spend.`,
      });
    }
  }

  const [topCombo] = getTopEntry(costTotals.byCombo);
  if (topCombo && totalRuns >= 3) {
    const comboShare = percent(costTotals.byCombo.get(topCombo) ?? 0, tokensOut || 1);
    insights.push({
      title: `${capitalize(topCombo)} combo dominates usage`,
      detail: `${comboShare} of generated tokens came from this combo. Share prompts with teammates or mark unused combos as archived to stay focused.`,
    });
  }

  if (insights.length === 0) {
    insights.push({
      title: "Healthy usage",
      detail: "Logs look balanced. Keep monitoring for spikes in cost or token volume to trigger auto-optimizations.",
    });
  }

  return insights.slice(0, 3);
}

function percent(value: number, total: number) {
  if (total <= 0) return "0%";
  return `${Math.round((value / total) * 100)}%`;
}

function sum(values: number[]) {
  return values.reduce((acc, value) => acc + value, 0);
}

function getTopEntry(map: Map<string, number>): [string | null, number] {
  let topKey: string | null = null;
  let topValue = 0;
  map.forEach((value, key) => {
    if (value > topValue) {
      topKey = key;
      topValue = value;
    }
  });
  return [topKey, topValue];
}

function capitalize(value: string) {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}
