export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      delivery_dates: {
        Row: {
          complex_ids: number[]
          created_at: string | null
          date: string
          id: number
        }
        Insert: {
          complex_ids: number[]
          created_at?: string | null
          date: string
          id?: number
        }
        Update: {
          complex_ids?: number[]
          created_at?: string | null
          date?: string
          id?: number
        }
        Relationships: []
      }
      orders: {
        Row: {
          created_at: string | null
          customer_name: string
          delivery_date: string
          id: number
          items: Json
          phone: string
          residential_complex_id: number | null
          status: string
          telegram_user_id: string | null
          telegram_username: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          customer_name: string
          delivery_date: string
          id?: number
          items: Json
          phone: string
          residential_complex_id?: number | null
          status?: string
          telegram_user_id?: string | null
          telegram_username: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          customer_name?: string
          delivery_date?: string
          id?: number
          items?: Json
          phone?: string
          residential_complex_id?: number | null
          status?: string
          telegram_user_id?: string | null
          telegram_username?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_residential_complex_id_fkey"
            columns: ["residential_complex_id"]
            isOneToOne: false
            referencedRelation: "residential_complexes"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          available: boolean | null
          created_at: string | null
          description: string | null
          farm: string | null
          id: number
          image: string | null
          inventory: number | null
          name: string
          price: number
          pricePerHalfKg: boolean | null
          unit: string | null
        }
        Insert: {
          available?: boolean | null
          created_at?: string | null
          description?: string | null
          farm?: string | null
          id?: number
          image?: string | null
          inventory?: number | null
          name: string
          price: number
          pricePerHalfKg?: boolean | null
          unit?: string | null
        }
        Update: {
          available?: boolean | null
          created_at?: string | null
          description?: string | null
          farm?: string | null
          id?: number
          image?: string | null
          inventory?: number | null
          name?: string
          price?: number
          pricePerHalfKg?: boolean | null
          unit?: string | null
        }
        Relationships: []
      }
      residential_complexes: {
        Row: {
          address: string | null
          available: boolean | null
          created_at: string | null
          id: number
          image: string | null
          name: string
        }
        Insert: {
          address?: string | null
          available?: boolean | null
          created_at?: string | null
          id?: number
          image?: string | null
          name: string
        }
        Update: {
          address?: string | null
          available?: boolean | null
          created_at?: string | null
          id?: number
          image?: string | null
          name?: string
        }
        Relationships: []
      }
      settings: {
        Row: {
          enable_notifications: boolean | null
          id: number
          maintenance_mode: boolean | null
          telegram_notifications: boolean | null
          updated_at: string | null
        }
        Insert: {
          enable_notifications?: boolean | null
          id?: number
          maintenance_mode?: boolean | null
          telegram_notifications?: boolean | null
          updated_at?: string | null
        }
        Update: {
          enable_notifications?: boolean | null
          id?: number
          maintenance_mode?: boolean | null
          telegram_notifications?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string | null
          id: number
          is_admin: boolean | null
          name: string | null
          phone: string | null
          telegram_username: string
        }
        Insert: {
          created_at?: string | null
          id?: number
          is_admin?: boolean | null
          name?: string | null
          phone?: string | null
          telegram_username: string
        }
        Update: {
          created_at?: string | null
          id?: number
          is_admin?: boolean | null
          name?: string | null
          phone?: string | null
          telegram_username?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
