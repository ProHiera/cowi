export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          name?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      projects: {
        Row: {
          id: string;
          owner_id: string;
          title: string;
          description: string | null;
          combo_type: "enterprise" | "web" | "app" | "custom";
          prompt_text: string | null;
          stack: string;
          status: "prompt_ready" | "code_generated" | "deploy_configured" | "domain_ready";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          title: string;
          description?: string | null;
          combo_type: "enterprise" | "web" | "app" | "custom";
          prompt_text?: string | null;
          stack: string;
          status?: "prompt_ready" | "code_generated" | "deploy_configured" | "domain_ready";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          title?: string;
          description?: string | null;
          combo_type?: "enterprise" | "web" | "app" | "custom";
          prompt_text?: string | null;
          stack?: string;
          status?: "prompt_ready" | "code_generated" | "deploy_configured" | "domain_ready";
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      project_configs: {
        Row: {
          id: string;
          project_id: string;
          repo_url: string | null;
          build_command: string | null;
          output_dir: string | null;
          env_config: Json | null;
          deployment_target: "vercel" | "concept_aws" | "concept_netlify" | "concept_expo";
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          repo_url?: string | null;
          build_command?: string | null;
          output_dir?: string | null;
          env_config?: Json | null;
          deployment_target?: "vercel" | "concept_aws" | "concept_netlify" | "concept_expo";
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          repo_url?: string | null;
          build_command?: string | null;
          output_dir?: string | null;
          env_config?: Json | null;
          deployment_target?: "vercel" | "concept_aws" | "concept_netlify" | "concept_expo";
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "project_configs_project_id_fkey";
            columns: ["project_id"];
            referencedRelation: "projects";
            referencedColumns: ["id"];
          }
        ];
      };
      prompt_templates: {
        Row: {
          id: string;
          title: string;
          description: string;
          content: string;
          tags: string[];
          combo_type: "enterprise" | "web" | "app" | "custom" | "all";
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description: string;
          content: string;
          tags?: string[];
          combo_type?: "enterprise" | "web" | "app" | "custom" | "all";
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          content?: string;
          tags?: string[];
          combo_type?: "enterprise" | "web" | "app" | "custom" | "all";
          created_at?: string;
        };
        Relationships: [];
      };
      prompt_library_entries: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          summary: string | null;
          content: string;
          combo_type: "enterprise" | "web" | "app" | "custom" | "all";
          tags: string[];
          metadata: Json | null;
          is_shared: boolean;
          usage_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          summary?: string | null;
          content: string;
          combo_type?: "enterprise" | "web" | "app" | "custom" | "all";
          tags?: string[];
          metadata?: Json | null;
          is_shared?: boolean;
          usage_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          summary?: string | null;
          content?: string;
          combo_type?: "enterprise" | "web" | "app" | "custom" | "all";
          tags?: string[];
          metadata?: Json | null;
          is_shared?: boolean;
          usage_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      prompt_usage_logs: {
        Row: {
          id: string;
          user_id: string;
          project_id: string | null;
          prompt_id: string | null;
          combo_type: "enterprise" | "web" | "app" | "custom" | "all" | null;
          provider: "cowi_free" | "openai" | "anthropic" | "azure_openai" | "google" | "custom" | null;
          tokens_input: number | null;
          tokens_output: number | null;
          cost_usd: number | null;
          metadata: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          project_id?: string | null;
          prompt_id?: string | null;
          combo_type?: "enterprise" | "web" | "app" | "custom" | "all" | null;
          provider?: "cowi_free" | "openai" | "anthropic" | "azure_openai" | "google" | "custom" | null;
          tokens_input?: number | null;
          tokens_output?: number | null;
          cost_usd?: number | null;
          metadata?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          project_id?: string | null;
          prompt_id?: string | null;
          combo_type?: "enterprise" | "web" | "app" | "custom" | "all" | null;
          provider?: "cowi_free" | "openai" | "anthropic" | "azure_openai" | "google" | "custom" | null;
          tokens_input?: number | null;
          tokens_output?: number | null;
          cost_usd?: number | null;
          metadata?: Json | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "prompt_usage_logs_project_id_fkey";
            columns: ["project_id"];
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "prompt_usage_logs_prompt_id_fkey";
            columns: ["prompt_id"];
            referencedRelation: "prompt_library_entries";
            referencedColumns: ["id"];
          }
        ];
      };
      onboarding_sessions: {
        Row: {
          id: string;
          user_id: string;
          purpose: string | null;
          target_audience: string | null;
          model_preference: string | null;
          hosting_target: string | null;
          api_provider: string | null;
          api_key_last_four: string | null;
          recommend_template_id: string | null;
          status: "draft" | "completed" | "failed";
          vercel_hook_url: string | null;
          deploy_triggered_at: string | null;
          deploy_response: Json | null;
          metadata: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          purpose?: string | null;
          target_audience?: string | null;
          model_preference?: string | null;
          hosting_target?: string | null;
          api_provider?: string | null;
          api_key_last_four?: string | null;
          recommend_template_id?: string | null;
          status?: "draft" | "completed" | "failed";
          vercel_hook_url?: string | null;
          deploy_triggered_at?: string | null;
          deploy_response?: Json | null;
          metadata?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          purpose?: string | null;
          target_audience?: string | null;
          model_preference?: string | null;
          hosting_target?: string | null;
          api_provider?: string | null;
          api_key_last_four?: string | null;
          recommend_template_id?: string | null;
          status?: "draft" | "completed" | "failed";
          vercel_hook_url?: string | null;
          deploy_triggered_at?: string | null;
          deploy_response?: Json | null;
          metadata?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "onboarding_sessions_recommend_template_id_fkey";
            columns: ["recommend_template_id"];
            referencedRelation: "prompt_templates";
            referencedColumns: ["id"];
          }
        ];
      };
      rooms: {
        Row: {
          id: string;
          project_id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          name?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "rooms_project_id_fkey";
            columns: ["project_id"];
            referencedRelation: "projects";
            referencedColumns: ["id"];
          }
        ];
      };
      room_states: {
        Row: {
          id: string;
          room_id: string;
          current_prompt_text: string;
          selected_combo_type: "enterprise" | "web" | "app" | "custom";
          updated_at: string;
        };
        Insert: {
          id?: string;
          room_id: string;
          current_prompt_text: string;
          selected_combo_type: "enterprise" | "web" | "app" | "custom";
          updated_at?: string;
        };
        Update: {
          id?: string;
          room_id?: string;
          current_prompt_text?: string;
          selected_combo_type?: "enterprise" | "web" | "app" | "custom";
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "room_states_room_id_fkey";
            columns: ["room_id"];
            referencedRelation: "rooms";
            referencedColumns: ["id"];
          }
        ];
      };
      room_participants: {
        Row: {
          id: string;
          room_id: string;
          user_id: string;
          joined_at: string;
        };
        Insert: {
          id?: string;
          room_id: string;
          user_id: string;
          joined_at?: string;
        };
        Update: {
          id?: string;
          room_id?: string;
          user_id?: string;
          joined_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "room_participants_room_id_fkey";
            columns: ["room_id"];
            referencedRelation: "rooms";
            referencedColumns: ["id"];
          }
        ];
      };
      user_model_configs: {
        Row: {
          id: string;
          user_id: string;
          label: string;
          provider: "cowi_free" | "openai" | "anthropic" | "azure_openai" | "google" | "custom";
          model_name: string;
          mode: "chat" | "prompt_builder" | "code_generation" | "analysis";
          secret_reference: string | null;
          api_key_last_four: string | null;
          base_url: string | null;
          metadata: Json | null;
          is_default: boolean;
          created_at: string;
          updated_at: string;
          last_used_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          label: string;
          provider: "cowi_free" | "openai" | "anthropic" | "azure_openai" | "google" | "custom";
          model_name: string;
          mode: "chat" | "prompt_builder" | "code_generation" | "analysis";
          secret_reference?: string | null;
          api_key_last_four?: string | null;
          base_url?: string | null;
          metadata?: Json | null;
          is_default?: boolean;
          created_at?: string;
          updated_at?: string;
          last_used_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          label?: string;
          provider?: "cowi_free" | "openai" | "anthropic" | "azure_openai" | "google" | "custom";
          model_name?: string;
          mode?: "chat" | "prompt_builder" | "code_generation" | "analysis";
          secret_reference?: string | null;
          api_key_last_four?: string | null;
          base_url?: string | null;
          metadata?: Json | null;
          is_default?: boolean;
          created_at?: string;
          updated_at?: string;
          last_used_at?: string | null;
        };
        Relationships: [];
      };
      agent_events: {
        Row: {
          id: string;
          user_id: string;
          event_type: "terminal" | "problem" | "translation" | "diff";
          source: string;
          status: "received" | "processing" | "ready" | "applied" | "error";
          payload: Json;
          language: string | null;
          detected_language: string | null;
          translated_text: string | null;
          summary: string | null;
          root_cause: Json | null;
          file_path: string | null;
          original_snippet: string | null;
          proposed_snippet: string | null;
          fix_patch: string | null;
          fix_status: string | null;
          resolution_notes: string | null;
          metadata: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          event_type: "terminal" | "problem" | "translation" | "diff";
          source?: string;
          status?: "received" | "processing" | "ready" | "applied" | "error";
          payload: Json;
          language?: string | null;
          detected_language?: string | null;
          translated_text?: string | null;
          summary?: string | null;
          root_cause?: Json | null;
          file_path?: string | null;
          original_snippet?: string | null;
          proposed_snippet?: string | null;
          fix_patch?: string | null;
          fix_status?: string | null;
          resolution_notes?: string | null;
          metadata?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          event_type?: "terminal" | "problem" | "translation" | "diff";
          source?: string;
          status?: "received" | "processing" | "ready" | "applied" | "error";
          payload?: Json;
          language?: string | null;
          detected_language?: string | null;
          translated_text?: string | null;
          summary?: string | null;
          root_cause?: Json | null;
          file_path?: string | null;
          original_snippet?: string | null;
          proposed_snippet?: string | null;
          fix_patch?: string | null;
          fix_status?: string | null;
          resolution_notes?: string | null;
          metadata?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "agent_events_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      project_ai_settings: {
        Row: {
          id: string;
          project_id: string;
          preferred_mode: "chat" | "prompt_builder" | "code_generation" | "analysis";
          model_config_id: string | null;
          fallback_provider: "cowi_free" | "openai" | "anthropic" | "azure_openai" | "google" | "custom";
          temperature: number | null;
          max_output_tokens: number | null;
          system_prompt: string | null;
          safety_level: "strict" | "balanced" | "creative";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          preferred_mode?: "chat" | "prompt_builder" | "code_generation" | "analysis";
          model_config_id?: string | null;
          fallback_provider?: "cowi_free" | "openai" | "anthropic" | "azure_openai" | "google" | "custom";
          temperature?: number | null;
          max_output_tokens?: number | null;
          system_prompt?: string | null;
          safety_level?: "strict" | "balanced" | "creative";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          preferred_mode?: "chat" | "prompt_builder" | "code_generation" | "analysis";
          model_config_id?: string | null;
          fallback_provider?: "cowi_free" | "openai" | "anthropic" | "azure_openai" | "google" | "custom";
          temperature?: number | null;
          max_output_tokens?: number | null;
          system_prompt?: string | null;
          safety_level?: "strict" | "balanced" | "creative";
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "project_ai_settings_model_config_id_fkey";
            columns: ["model_config_id"];
            referencedRelation: "user_model_configs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "project_ai_settings_project_id_fkey";
            columns: ["project_id"];
            referencedRelation: "projects";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
