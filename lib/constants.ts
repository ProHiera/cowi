import type { ComboPreset, PromptTemplate } from "@/lib/types";

export const COMBO_PRESETS: ComboPreset[] = [
  {
    id: "enterprise",
    name: "Enterprise Combo",
    target: "both",
    difficulty: "advanced",
    costEstimate: "$$$",
    summary:
      "Concept architecture covering GitHub + CI/CD + AWS (ECS/EB) + Cloudflare DNS, while the platform still runs on Vercel + Supabase.",
    tools: ["GitHub", "CI/CD", "AWS ECS", "AWS EB", "Cloudflare DNS"],
    defaultStack: "nextjs-web",
    recommendations: [
      {
        target: "vercel",
        headline: "Deploy control plane on Vercel",
        pros: [
          "Edge network, zero-config scaling",
          "Easiest path to integrate Supabase APIs",
          "Preview deployments for enterprise stakeholders",
        ],
        cons: [
          "Limited long-running background jobs",
          "Private networking requires Vercel Enterprise",
        ],
      },
      {
        target: "concept_aws",
        headline: "Concept: application workloads on AWS",
        pros: ["Elastic compute options", "Mature security tooling"],
        cons: ["Higher operational overhead"],
        conceptOnly: true,
      },
    ],
  },
  {
    id: "web",
    name: "Starter Web Combo",
    target: "web",
    difficulty: "starter",
    costEstimate: "$$",
    summary:
      "GitHub + Vercel + Supabase + lightweight DNS guide. This is the most realistic default combo.",
    tools: ["GitHub", "Vercel", "Supabase", "DNS playbook"],
    defaultStack: "nextjs-web",
    recommendations: [
      {
        target: "vercel",
        headline: "Deploy on Vercel (recommended)",
        pros: ["Fastest Next.js deploys", "CI/CD baked in", "Automatic HTTPS"],
        cons: ["Build minutes on free tier"],
      },
      {
        target: "concept_netlify",
        headline: "Concept: Netlify alternative",
        pros: ["Simple DX", "Graph integrations"],
        cons: ["Less native App Router support"],
        conceptOnly: true,
      },
    ],
  },
  {
    id: "app",
    name: "Mobile / App Combo",
    target: "app",
    difficulty: "intermediate",
    costEstimate: "$$",
    summary:
      "GitHub + Expo / React Native pipeline with Supabase backend. Concept references for stores and OTA updates.",
    tools: ["GitHub", "Expo", "EAS Build", "Supabase"],
    defaultStack: "react-native-app",
    recommendations: [
      {
        target: "concept_expo",
        headline: "Concept: Expo Application Services",
        pros: ["OTA updates", "Store submissions"],
        cons: ["Mobile-specific build credits"],
        conceptOnly: true,
      },
      {
        target: "vercel",
        headline: "Deploy marketing site on Vercel",
        pros: ["Unified web portal", "Reuse Next.js components"],
        cons: ["App binaries still handled elsewhere"],
      },
    ],
  },
  {
    id: "custom",
    name: "Custom Combo",
    target: "both",
    difficulty: "intermediate",
    costEstimate: "Flexible",
    summary: "Mix and match deployment primitives manually.",
    tools: ["Select tools manually"],
    defaultStack: "nextjs-custom",
    recommendations: [
      {
        target: "vercel",
        headline: "Start from Vercel baseline",
        pros: ["Opinionated defaults", "Easy rollbacks"],
        cons: ["Need clarity on target environments"],
      },
    ],
  },
];

export const PROJECT_STATUS_LABELS: Record<string, string> = {
  prompt_ready: "Prompt Ready",
  code_generated: "Code Generated",
  deploy_configured: "Deployment Configured",
  domain_ready: "Domain Ready",
};

export const FALLBACK_PROMPTS: PromptTemplate[] = [
  {
    id: "saas-dashboard",
    title: "SaaS dashboard",
    description: "Multi-tenant billing dashboard with Supabase Auth and row-level security",
    content:
      "Build a SaaS analytics dashboard with onboarding wizard, roles (owner, analyst), usage metrics, and deployment notes for Vercel + Supabase.",
    tags: ["web", "enterprise", "starter"],
    combo_type: "web",
    created_at: new Date().toISOString(),
  },
  {
    id: "portfolio",
    title: "Portfolio site",
    description: "Personal site with blog, projects, and contact form",
    content:
      "Create a developer portfolio that highlights case studies, integrates Supabase for blog content, and includes deployment guidance for custom domains.",
    tags: ["web", "custom"],
    combo_type: "web",
    created_at: new Date().toISOString(),
  },
  {
    id: "mobile-shell",
    title: "Mobile companion app",
    description: "React Native companion app that mirrors project boards",
    content:
      "Generate a mobile shell using Expo Router that consumes Supabase APIs, includes offline caching, and explains how to publish via EAS.",
    tags: ["app"],
    combo_type: "app",
    created_at: new Date().toISOString(),
  },
];
