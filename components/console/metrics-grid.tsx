import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface MetricItem {
  label: string;
  value: number;
  helper?: string;
}

interface MetricSection {
  title: string;
  metrics: MetricItem[];
}

interface MetricsGridProps {
  sections: MetricSection[];
}

export function MetricsGrid({ sections }: MetricsGridProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {sections.map((section) => (
        <Card key={section.title} className="h-full">
          <CardHeader>
            <CardTitle className="text-base font-medium">{section.title}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            {section.metrics.map((metric) => (
              <div key={metric.label} className="rounded-md border bg-muted/50 p-4">
                <p className="text-xs uppercase text-muted-foreground">{metric.label}</p>
                <p className="text-3xl font-semibold">{metric.value}</p>
                {metric.helper && <p className="text-xs text-muted-foreground">{metric.helper}</p>}
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
