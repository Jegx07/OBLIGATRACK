import type { Database } from '@/lib/database.types'

export type Profile = Database['public']['Tables']['profiles']['Row']
export type Contract = Database['public']['Tables']['contracts']['Row']
export type Obligation = Database['public']['Tables']['obligations']['Row']
export type ActivityLog = Database['public']['Tables']['activity_log']['Row']

export type ContractInsert = Database['public']['Tables']['contracts']['Insert']
export type ContractUpdate = Database['public']['Tables']['contracts']['Update']
export type ObligationInsert = Database['public']['Tables']['obligations']['Insert']
export type ObligationUpdate = Database['public']['Tables']['obligations']['Update']
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update']

export type ContractStatus = Contract['status']
export type ObligationStatus = Obligation['status']
export type ObligationType = Obligation['obligation_type']
export type ObligationPriority = Obligation['priority']
export type TriggerType = Obligation['trigger_type']
export type UserRole = Profile['role']

// Extended types with joins
export type ObligationWithDetails = Obligation & {
  contract?: Contract | null
  owner?: Profile | null
}

export type ContractWithObligations = Contract & {
  obligations?: Obligation[]
}

// Deadline classification
export type DeadlineStatus =
  | 'completed'
  | 'cancelled'
  | 'overdue'
  | 'due_today'
  | 'urgent'        // within 3 days
  | 'approaching'   // within 7 days
  | 'on_track'
  | 'no_deadline'

// Risk level
export type RiskLevel = 'low' | 'medium' | 'high'

export interface RiskScore {
  score: number
  level: RiskLevel
  reasons: string[]
}

// Clause extraction result
export interface ClauseExtractionResult {
  title?: string
  structured_description?: string
  responsible_party?: string
  obligation_type?: ObligationType
  trigger_type?: TriggerType
  trigger_date?: string
  duration_days?: number
  due_date?: string
  priority?: ObligationPriority
  confidence: Record<string, 'extracted' | 'calculated' | 'manual' | 'unconfirmed'>
  warnings: string[]
}

// Filter state
export interface ObligationFilters {
  search?: string
  contract_id?: string
  owner_id?: string | 'unassigned'
  priority?: ObligationPriority
  status?: ObligationStatus
  deadline?: 'overdue' | 'due_today' | 'urgent' | 'approaching' | 'no_deadline'
}

export interface ContractFilters {
  search?: string
  status?: ContractStatus
}

// Dashboard metrics
export interface DashboardMetrics {
  totalActiveObligations: number
  upcomingDeadlines: number
  overdueObligations: number
  unassignedObligations: number
  completedObligations: number
}
