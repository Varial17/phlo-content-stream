export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      ai_logs: {
        Row: {
          client_id: string | null
          created_at: string | null
          error_message: string | null
          function_name: string | null
          id: string
          input_tokens: number | null
          output_tokens: number | null
          success: boolean | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string | null
          error_message?: string | null
          function_name?: string | null
          id?: string
          input_tokens?: number | null
          output_tokens?: number | null
          success?: boolean | null
        }
        Update: {
          client_id?: string | null
          created_at?: string | null
          error_message?: string | null
          function_name?: string | null
          id?: string
          input_tokens?: number | null
          output_tokens?: number | null
          success?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_logs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_profiles: {
        Row: {
          business_description: string | null
          client_id: string
          competitors: string[] | null
          content_pillars: string[] | null
          cta_style: string | null
          id: string
          industry: string | null
          location: string | null
          post_length_linkedin: string | null
          post_length_threads: string | null
          services: string[] | null
          target_audience: string | null
          tone_of_voice: string | null
          topics_to_avoid: string[] | null
          updated_at: string | null
          use_emojis: boolean | null
          use_hashtags: boolean | null
          website_url: string | null
          words_to_avoid: string[] | null
          words_to_use: string[] | null
          writing_examples: string | null
          writing_style_notes: string | null
        }
        Insert: {
          business_description?: string | null
          client_id: string
          competitors?: string[] | null
          content_pillars?: string[] | null
          cta_style?: string | null
          id?: string
          industry?: string | null
          location?: string | null
          post_length_linkedin?: string | null
          post_length_threads?: string | null
          services?: string[] | null
          target_audience?: string | null
          tone_of_voice?: string | null
          topics_to_avoid?: string[] | null
          updated_at?: string | null
          use_emojis?: boolean | null
          use_hashtags?: boolean | null
          website_url?: string | null
          words_to_avoid?: string[] | null
          words_to_use?: string[] | null
          writing_examples?: string | null
          writing_style_notes?: string | null
        }
        Update: {
          business_description?: string | null
          client_id?: string
          competitors?: string[] | null
          content_pillars?: string[] | null
          cta_style?: string | null
          id?: string
          industry?: string | null
          location?: string | null
          post_length_linkedin?: string | null
          post_length_threads?: string | null
          services?: string[] | null
          target_audience?: string | null
          tone_of_voice?: string | null
          topics_to_avoid?: string[] | null
          updated_at?: string | null
          use_emojis?: boolean | null
          use_hashtags?: boolean | null
          website_url?: string | null
          words_to_avoid?: string[] | null
          words_to_use?: string[] | null
          writing_examples?: string | null
          writing_style_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "brand_profiles_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: true
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          avatar_url: string | null
          billing_status: string | null
          channels: string[] | null
          color: string
          contact_email: string | null
          created_at: string | null
          follower_growth: string | null
          id: string
          initials: string
          joined: string | null
          linkedin_followers: number | null
          name: string
          next_billing: string | null
          plan: string | null
        }
        Insert: {
          avatar_url?: string | null
          billing_status?: string | null
          channels?: string[] | null
          color: string
          contact_email?: string | null
          created_at?: string | null
          follower_growth?: string | null
          id: string
          initials: string
          joined?: string | null
          linkedin_followers?: number | null
          name: string
          next_billing?: string | null
          plan?: string | null
        }
        Update: {
          avatar_url?: string | null
          billing_status?: string | null
          channels?: string[] | null
          color?: string
          contact_email?: string | null
          created_at?: string | null
          follower_growth?: string | null
          id?: string
          initials?: string
          joined?: string | null
          linkedin_followers?: number | null
          name?: string
          next_billing?: string | null
          plan?: string | null
        }
        Relationships: []
      }
      ideas: {
        Row: {
          angle: string | null
          channel: string[] | null
          client_id: string
          created_at: string | null
          hook: string
          id: string
          relevance: number | null
          source_summary: string | null
          source_url: string | null
          status: string | null
        }
        Insert: {
          angle?: string | null
          channel?: string[] | null
          client_id: string
          created_at?: string | null
          hook: string
          id?: string
          relevance?: number | null
          source_summary?: string | null
          source_url?: string | null
          status?: string | null
        }
        Update: {
          angle?: string | null
          channel?: string[] | null
          client_id?: string
          created_at?: string | null
          hook?: string
          id?: string
          relevance?: number | null
          source_summary?: string | null
          source_url?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ideas_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          ai_generated: boolean | null
          assigned_to: string | null
          body: string | null
          channel: string
          client_change_request: string | null
          client_id: string
          created_at: string | null
          due_date: string | null
          hook: string
          id: string
          idea_id: string | null
          image_url: string | null
          scheduled_date: string | null
          scheduled_time: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          ai_generated?: boolean | null
          assigned_to?: string | null
          body?: string | null
          channel: string
          client_change_request?: string | null
          client_id: string
          created_at?: string | null
          due_date?: string | null
          hook: string
          id?: string
          idea_id?: string | null
          image_url?: string | null
          scheduled_date?: string | null
          scheduled_time?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          ai_generated?: boolean | null
          assigned_to?: string | null
          body?: string | null
          channel?: string
          client_change_request?: string | null
          client_id?: string
          created_at?: string | null
          due_date?: string | null
          hook?: string
          id?: string
          idea_id?: string | null
          image_url?: string | null
          scheduled_date?: string | null
          scheduled_time?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: false
            referencedRelation: "ideas"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          client_id: string | null
          created_at: string | null
          id: string
          name: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string | null
          id: string
          name?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string | null
          id?: string
          name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_client_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "staff" | "client"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "staff", "client"],
    },
  },
} as const
