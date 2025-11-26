export type ComboType = "enterprise" | "web" | "app" | "custom";

export type ProjectStatus =
  | "prompt_ready"
  | "code_generated"
  | "deploy_configured"
  | "domain_ready";

export type DeploymentTarget = "vercel" | "concept_aws" | "concept_netlify" | "concept_expo";

export type AIProvider = "cowi_free" | "openai" | "anthropic" | "azure_openai" | "google" | "custom";

export type AIUsageMode = "chat" | "prompt_builder" | "code_generation" | "analysis";

export interface UserModelConfig {
  id: string;
  user_id: string;
  label: string;
  provider: AIProvider;
  model_name: string;
  mode: AIUsageMode;
  secret_reference: string | null;
  api_key_last_four: string | null;
  base_url: string | null;
  metadata: Record<string, string> | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
  last_used_at: string | null;
}

export interface ProjectAISettings {
  id: string;
  project_id: string;
  preferred_mode: AIUsageMode;
  model_config_id: string | null;
  fallback_provider: AIProvider;
  temperature: number | null;
  max_output_tokens: number | null;
  system_prompt: string | null;
  safety_level: "strict" | "balanced" | "creative";
  created_at: string;
  updated_at: string;
}

export interface ResolvedModelConfig {
  provider: AIProvider;
  model_name: string;
  mode: AIUsageMode;
  api_key: string | null;
  base_url?: string | null;
  metadata?: Record<string, string> | null;
  temperature?: number | null;
  max_output_tokens?: number | null;
  system_prompt?: string | null;
  safety_level?: "strict" | "balanced" | "creative";
}

export interface AIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AIResponse {
  output: string;
  provider: AIProvider;
  model: string;
  raw?: unknown;
}

export interface User {
  id: string;
  email: string;
  name: string | null;
  created_at: string;
}

export interface Project {
  id: string;
  owner_id: string;
  title: string;
  description: string | null;
  combo_type: ComboType;
  prompt_text: string | null;
  stack: string;
  status: ProjectStatus;
  created_at: string;
  updated_at: string;
}

export interface ProjectConfig {
  id: string;
  project_id: string;
  repo_url: string | null;
  build_command: string | null;
  output_dir: string | null;
  env_config: Record<string, string> | null;
  deployment_target: DeploymentTarget;
  created_at: string;
}

export interface PromptTemplate {
  id: string;
  title: string;
  description: string;
  content: string;
  tags: string[];
  combo_type: ComboType | "all";
  created_at: string;
}

export interface PromptLibraryEntry {
  id: string;
  user_id: string;
  title: string;
  summary: string | null;
  content: string;
  combo_type: ComboType | "all";
  tags: string[];
  metadata: Record<string, unknown> | null;
  is_shared: boolean;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

export interface PromptUsageLog {
  id: string;
  user_id: string;
  project_id: string | null;
  prompt_id: string | null;
  combo_type: ComboType | null;
  provider: AIProvider | null;
  tokens_input: number | null;
  tokens_output: number | null;
  cost_usd: number | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface PromptRecommendation {
  id: string;
  title: string;
  summary: string | null;
  combo_type: ComboType | "all";
  tags: string[];
  content: string;
  score: number;
  reason: string;
  source: "rule" | "llm" | "fallback";
}

export type AgentEventType = "terminal" | "problem" | "translation" | "diff";
export type AgentEventStatus = "received" | "processing" | "ready" | "applied" | "error";

export interface AgentEvent {
  id: string;
  user_id: string;
  event_type: AgentEventType;
  source: "vscode" | "web";
  status: AgentEventStatus;
  payload: Record<string, unknown>;
  language: string | null;
  detected_language: string | null;
  translated_text: string | null;
  summary: string | null;
  root_cause: Array<{ title: string; detail: string; confidence: number }> | null;
  file_path: string | null;
  original_snippet: string | null;
  proposed_snippet: string | null;
  fix_patch: string | null;
  fix_status: "suggested" | "applied" | "rejected" | null;
  resolution_notes: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface Room {
  id: string;
  project_id: string;
  name: string;
  created_at: string;
}

export interface RoomState {
  id: string;
  room_id: string;
  current_prompt_text: string;
  selected_combo_type: ComboType;
  updated_at: string;
}

export interface RoomParticipant {
  id: string;
  room_id: string;
  user_id: string;
  joined_at: string;
}

export type OnboardingStatus = "draft" | "completed" | "failed";

export interface OnboardingSession {
  id: string;
  user_id: string;
  purpose: string | null;
  target_audience: string | null;
  model_preference: string | null;
  hosting_target: string | null;
  api_provider: string | null;
  api_key_last_four: string | null;
  recommend_template_id: string | null;
  status: OnboardingStatus;
  vercel_hook_url: string | null;
  deploy_triggered_at: string | null;
  deploy_response: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export type { Database } from "@/supabase/types.gen";

export interface DeploymentRecommendation {
  target: DeploymentTarget;
  headline: string;
  pros: string[];
  cons: string[];
  conceptOnly?: boolean;
}

export interface ComboPreset {
  id: ComboType;
  name: string;
  target: "web" | "app" | "both";
  difficulty: "starter" | "intermediate" | "advanced";
  costEstimate: string;
  summary: string;
  tools: string[];
  defaultStack: string;
  recommendations: DeploymentRecommendation[];
}

export interface DeployLogEntry {
  sessionId: string;
  hookUrl: string | null;
  triggeredAt: string | null;
  ok: boolean | null;
  statusCode: number | null;
  bodyPreview: string | null;
  errorMessage: string | null;
}

export interface ConsoleProjectRow {
  project: Project;
  config: ProjectConfig | null;
}

export interface ConsoleSummary {
  onboardingTotals: Partial<Record<OnboardingStatus, number>>;
  projectTotals: Partial<Record<ProjectStatus, number>>;
  recentOnboarding: OnboardingSession[];
  recentProjects: ConsoleProjectRow[];
  deployLog: DeployLogEntry[];
  generatedAt: string;
}
