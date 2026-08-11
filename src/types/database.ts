export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          nickname: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          nickname: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          nickname?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      stages: {
        Row: {
          id: number;
          slug: string;
          title: string;
          description: string | null;
          stage_order: number;
          is_published: boolean;
          created_at: string;
        };
        Insert: {
          id: number;
          slug: string;
          title: string;
          description?: string | null;
          stage_order: number;
          is_published?: boolean;
          created_at?: string;
        };
        Update: {
          id?: number;
          slug?: string;
          title?: string;
          description?: string | null;
          stage_order?: number;
          is_published?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      user_stage_progress: {
        Row: {
          id: string;
          user_id: string;
          stage_id: number;
          status: "locked" | "unlocked" | "in_progress" | "cleared";
          best_clear_time_ms: number | null;
          started_at: string | null;
          cleared_at: string | null;
          last_played_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          stage_id: number;
          status: "locked" | "unlocked" | "in_progress" | "cleared";
          best_clear_time_ms?: number | null;
          started_at?: string | null;
          cleared_at?: string | null;
          last_played_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          stage_id?: number;
          status?: "locked" | "unlocked" | "in_progress" | "cleared";
          best_clear_time_ms?: number | null;
          started_at?: string | null;
          cleared_at?: string | null;
          last_played_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_stage_progress_stage_id_fkey";
            columns: ["stage_id"];
            isOneToOne: false;
            referencedRelation: "stages";
            referencedColumns: ["id"];
          },
        ];
      };
      user_stage_saves: {
        Row: {
          user_id: string;
          stage_id: number;
          state: Json;
          save_version: number;
          elapsed_time_ms: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          stage_id: number;
          state: Json;
          save_version: number;
          elapsed_time_ms?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          stage_id?: number;
          state?: Json;
          save_version?: number;
          elapsed_time_ms?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_stage_saves_stage_id_fkey";
            columns: ["stage_id"];
            isOneToOne: false;
            referencedRelation: "stages";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      complete_stage_one: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      complete_stage: {
        Args: {
          p_clear_time_ms: number;
          p_stage_id: number;
        };
        Returns: undefined;
      };
      ensure_user_setup: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
      ensure_my_profile: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      get_stage_one_progress: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      save_stage_one_progress: {
        Args: {
          p_elapsed_time_ms: number;
          p_save_version: number;
          p_state: Json;
        };
        Returns: undefined;
      };
      reset_my_game_data: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
      start_stage_one: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      start_stage: {
        Args: {
          p_stage_id: number;
        };
        Returns: undefined;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
export type StageRow = Database["public"]["Tables"]["stages"]["Row"];
export type UserStageProgressRow =
  Database["public"]["Tables"]["user_stage_progress"]["Row"];
export type UserStageSaveRow =
  Database["public"]["Tables"]["user_stage_saves"]["Row"];
