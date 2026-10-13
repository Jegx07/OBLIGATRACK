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
      profiles: {
        Row: {
          id: string
          full_name: string
          email: string
          role: 'admin' | 'manager' | 'member'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          full_name: string
          email: string
          role?: 'admin' | 'manager' | 'member'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          email?: string
          role?: 'admin' | 'manager' | 'member'
          updated_at?: string
        }
        Relationships: []
      }
      contracts: {
        Row: {
          id: string
          contract_reference: string
          title: string
          first_party: string
          second_party: string
          description: string | null
          start_date: string
          end_date: string
          renewal_date: string | null
          status: 'draft' | 'active' | 'expired' | 'terminated'
          notes: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          contract_reference: string
          title: string
          first_party: string
          second_party: string
          description?: string | null
          start_date: string
          end_date: string
          renewal_date?: string | null
          status?: 'draft' | 'active' | 'expired' | 'terminated'
          notes?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          contract_reference?: string
          title?: string
          first_party?: string
          second_party?: string
          description?: string | null
          start_date?: string
          end_date?: string
          renewal_date?: string | null
          status?: 'draft' | 'active' | 'expired' | 'terminated'
          notes?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      obligations: {
        Row: {
          id: string
          contract_id: string
          title: string
          original_clause: string | null
          structured_description: string | null
          obligation_type: 'payment' | 'delivery' | 'reporting' | 'renewal' | 'compliance' | 'service' | 'other'
          responsible_party: string | null
          owner_id: string | null
          trigger_type: 'fixed_date' | 'relative_to_start' | 'relative_to_event' | 'manual' | null
          trigger_date: string | null
          duration_days: number | null
          due_date: string | null
          reminder_date: string | null
          priority: 'low' | 'medium' | 'high' | 'critical'
          status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
          notes: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          contract_id: string
          title: string
          original_clause?: string | null
          structured_description?: string | null
          obligation_type?: 'payment' | 'delivery' | 'reporting' | 'renewal' | 'compliance' | 'service' | 'other'
          responsible_party?: string | null
          owner_id?: string | null
          trigger_type?: 'fixed_date' | 'relative_to_start' | 'relative_to_event' | 'manual' | null
          trigger_date?: string | null
          duration_days?: number | null
          due_date?: string | null
          reminder_date?: string | null
          priority?: 'low' | 'medium' | 'high' | 'critical'
          status?: 'pending' | 'in_progress' | 'completed' | 'cancelled'
          notes?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          contract_id?: string
          title?: string
          original_clause?: string | null
          structured_description?: string | null
          obligation_type?: 'payment' | 'delivery' | 'reporting' | 'renewal' | 'compliance' | 'service' | 'other'
          responsible_party?: string | null
          owner_id?: string | null
          trigger_type?: 'fixed_date' | 'relative_to_start' | 'relative_to_event' | 'manual' | null
          trigger_date?: string | null
          duration_days?: number | null
          due_date?: string | null
          reminder_date?: string | null
          priority?: 'low' | 'medium' | 'high' | 'critical'
          status?: 'pending' | 'in_progress' | 'completed' | 'cancelled'
          notes?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      activity_log: {
        Row: {
          id: string
          entity_type: string
          entity_id: string
          action: string
          description: string
          actor_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          entity_type: string
          entity_id: string
          action: string
          description: string
          actor_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          entity_type?: string
          entity_id?: string
          action?: string
          description?: string
          actor_id?: string | null
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
