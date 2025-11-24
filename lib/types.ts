export type ComboType = "enterprise" | "web" | "app" | "custom";

export type ProjectStatus =
  | "prompt_ready"
  | "code_generated"
  | "deploy_configured"
  | "domain_ready";

export type DeploymentTarget = "vercel" | "concept_aws" | "concept_netlify" | "concept_expo";

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

export type Tables = {
  users: User;
  projects: Project;
  project_configs: ProjectConfig;
  prompt_templates: PromptTemplate;
  rooms: Room;
  room_states: RoomState;
  room_participants: RoomParticipant;
};

export type Database = {
  public: {
    Tables: {
      [K in keyof Tables]: {
        Row: Tables[K];
        Insert: Partial<Tables[K]>;
        Update: Partial<Tables[K]>;
      };
    };
  };
};

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
