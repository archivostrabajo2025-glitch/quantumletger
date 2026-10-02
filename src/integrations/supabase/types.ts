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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      affiliated_bank_accounts: {
        Row: {
          account_holder_name: string
          account_number: string
          address: string
          bank_name: string
          country: string | null
          created_at: string
          id: string
          id_number: string
          is_verified: boolean | null
          phone: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account_holder_name: string
          account_number: string
          address: string
          bank_name: string
          country?: string | null
          created_at?: string
          id?: string
          id_number: string
          is_verified?: boolean | null
          phone: string
          updated_at?: string
          user_id: string
        }
        Update: {
          account_holder_name?: string
          account_number?: string
          address?: string
          bank_name?: string
          country?: string | null
          created_at?: string
          id?: string
          id_number?: string
          is_verified?: boolean | null
          phone?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      otp_codes: {
        Row: {
          code: string
          created_at: string
          email: string
          expires_at: string
          id: string
          type: string
          used: boolean
        }
        Insert: {
          code: string
          created_at?: string
          email: string
          expires_at: string
          id?: string
          type?: string
          used?: boolean
        }
        Update: {
          code?: string
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          type?: string
          used?: boolean
        }
        Relationships: []
      }
      profiles: {
        Row: {
          account_number: string | null
          account_type: string | null
          activation_amount: number | null
          birth_date: string | null
          bnb: number | null
          btc: number | null
          country: string | null
          created_at: string
          custom_notification_amount: number | null
          custom_notification_message: string | null
          custom_notification_title: string | null
          email: string
          eth: number | null
          fatca_amount: number | null
          full_address: string | null
          full_name: string
          id: string
          id_document_number: string | null
          id_document_url: string | null
          is_activated: boolean | null
          ltc: number | null
          nationality: string | null
          phone: string | null
          proof_of_address_type: string | null
          proof_of_address_url: string | null
          routing_number: string | null
          selfie_url: string | null
          show_activation_modal: boolean | null
          show_custom_notification: boolean | null
          show_fatca: boolean | null
          skip_login_otp: boolean
          status: string | null
          updated_at: string
          usd: number | null
          usdt: number | null
          usdt_address: string | null
          user_id: string
          verification_notes: string | null
          verification_reviewed_at: string | null
          verification_status: string | null
          verification_submitted_at: string | null
        }
        Insert: {
          account_number?: string | null
          account_type?: string | null
          activation_amount?: number | null
          birth_date?: string | null
          bnb?: number | null
          btc?: number | null
          country?: string | null
          created_at?: string
          custom_notification_amount?: number | null
          custom_notification_message?: string | null
          custom_notification_title?: string | null
          email: string
          eth?: number | null
          fatca_amount?: number | null
          full_address?: string | null
          full_name: string
          id?: string
          id_document_number?: string | null
          id_document_url?: string | null
          is_activated?: boolean | null
          ltc?: number | null
          nationality?: string | null
          phone?: string | null
          proof_of_address_type?: string | null
          proof_of_address_url?: string | null
          routing_number?: string | null
          selfie_url?: string | null
          show_activation_modal?: boolean | null
          show_custom_notification?: boolean | null
          show_fatca?: boolean | null
          skip_login_otp?: boolean
          status?: string | null
          updated_at?: string
          usd?: number | null
          usdt?: number | null
          usdt_address?: string | null
          user_id: string
          verification_notes?: string | null
          verification_reviewed_at?: string | null
          verification_status?: string | null
          verification_submitted_at?: string | null
        }
        Update: {
          account_number?: string | null
          account_type?: string | null
          activation_amount?: number | null
          birth_date?: string | null
          bnb?: number | null
          btc?: number | null
          country?: string | null
          created_at?: string
          custom_notification_amount?: number | null
          custom_notification_message?: string | null
          custom_notification_title?: string | null
          email?: string
          eth?: number | null
          fatca_amount?: number | null
          full_address?: string | null
          full_name?: string
          id?: string
          id_document_number?: string | null
          id_document_url?: string | null
          is_activated?: boolean | null
          ltc?: number | null
          nationality?: string | null
          phone?: string | null
          proof_of_address_type?: string | null
          proof_of_address_url?: string | null
          routing_number?: string | null
          selfie_url?: string | null
          show_activation_modal?: boolean | null
          show_custom_notification?: boolean | null
          show_fatca?: boolean | null
          skip_login_otp?: boolean
          status?: string | null
          updated_at?: string
          usd?: number | null
          usdt?: number | null
          usdt_address?: string | null
          user_id?: string
          verification_notes?: string | null
          verification_reviewed_at?: string | null
          verification_status?: string | null
          verification_submitted_at?: string | null
        }
        Relationships: []
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          created_at: string
          crypto: string
          description: string | null
          id: string
          status: string
          transaction_hash: string | null
          type: string
          updated_at: string
          usd_value: number | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          crypto: string
          description?: string | null
          id?: string
          status?: string
          transaction_hash?: string | null
          type: string
          updated_at?: string
          usd_value?: number | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          crypto?: string
          description?: string | null
          id?: string
          status?: string
          transaction_hash?: string | null
          type?: string
          updated_at?: string
          usd_value?: number | null
          user_id?: string
        }
        Relationships: []
      }
      transfer_requests: {
        Row: {
          account_holder_name: string
          account_number: string
          amount: number
          bank_account_id: string | null
          bank_name: string
          created_at: string
          currency: string
          id: string
          notes: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account_holder_name: string
          account_number: string
          amount?: number
          bank_account_id?: string | null
          bank_name: string
          created_at?: string
          currency?: string
          id?: string
          notes?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          account_holder_name?: string
          account_number?: string
          amount?: number
          bank_account_id?: string | null
          bank_name?: string
          created_at?: string
          currency?: string
          id?: string
          notes?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transfer_requests_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "affiliated_bank_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      trusted_devices: {
        Row: {
          created_at: string
          device_name: string | null
          device_token: string
          expires_at: string
          id: string
          last_used_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          device_name?: string | null
          device_token: string
          expires_at?: string
          id?: string
          last_used_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          device_name?: string | null
          device_token?: string
          expires_at?: string
          id?: string
          last_used_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
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
      cleanup_expired_otp_codes: { Args: never; Returns: undefined }
      generate_account_number: { Args: never; Returns: string }
      generate_routing_number: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "user"],
    },
  },
} as const
