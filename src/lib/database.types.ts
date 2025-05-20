
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      delivery_dates: {
        Row: {
          complex_ids: number[] | null
          created_at: string
          date: string
          id: number
        }
        Insert: {
          complex_ids?: number[] | null
          created_at?: string
          date: string
          id?: number
        }
        Update: {
          complex_ids?: number[] | null
          created_at?: string
          date?: string
          id?: number
        }
        Relationships: []
      }
      orders: {
        Row: {
          address: string | null
          created_at: string
          customer_name: string
          delivery_date: string
          id: number
          items: Json
          phone: string
          residential_complex_id: number | null
          status: string
          telegram_user_id: string | null
          telegram_username: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          customer_name: string
          delivery_date: string
          id?: number
          items: Json
          phone: string
          residential_complex_id?: number | null
          status?: string
          telegram_user_id?: string | null
          telegram_username: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          customer_name?: string
          delivery_date?: string
          id?: number
          items?: Json
          phone?: string
          residential_complex_id?: number | null
          status?: string
          telegram_user_id?: string | null
          telegram_username?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_residential_complex_id_fkey"
            columns: ["residential_complex_id"]
            referencedRelation: "residential_complexes"
            referencedColumns: ["id"]
          }
        ]
      }
      products: {
        Row: {
          available: boolean
          created_at: string
          description: string | null
          farm: string | null
          id: number
          image: string | null
          name: string
          price: number
          inventory: number
          unit: string
          pricePerHalfKg: boolean
        }
        Insert: {
          available?: boolean
          created_at?: string
          description?: string | null
          farm?: string | null
          id?: number
          image?: string | null
          name: string
          price: number
          inventory?: number
          unit?: string
          pricePerHalfKg?: boolean
        }
        Update: {
          available?: boolean
          created_at?: string
          description?: string | null
          farm?: string | null
          id?: number
          image?: string | null
          name?: string
          price?: number
          inventory?: number
          unit?: string
          pricePerHalfKg?: boolean
        }
        Relationships: []
      }
      residential_complexes: {
        Row: {
          address: string | null
          available: boolean
          created_at: string
          id: number
          image: string | null
          name: string
        }
        Insert: {
          address?: string | null
          available?: boolean
          created_at?: string
          id?: number
          image?: string | null
          name: string
        }
        Update: {
          address?: string | null
          available?: boolean
          created_at?: string
          id?: number
          image?: string | null
          name?: string
        }
        Relationships: []
      }
      settings: {
        Row: {
          created_at: string
          id: number
          key: string
          value: Json
        }
        Insert: {
          created_at?: string
          id?: number
          key: string
          value: Json
        }
        Update: {
          created_at?: string
          id?: number
          key?: string
          value?: Json
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string
          id: number
          is_admin: boolean
          name: string | null
          phone: string | null
          telegram_username: string
        }
        Insert: {
          created_at?: string
          id?: number
          is_admin?: boolean
          name?: string | null
          phone?: string | null
          telegram_username: string
        }
        Update: {
          created_at?: string
          id?: number
          is_admin?: boolean
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
      exec_sql: {
        Args: {
          query: string
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
