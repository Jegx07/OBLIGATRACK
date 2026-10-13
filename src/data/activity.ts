import { supabase } from '@/lib/supabase'
import type { ActivityLog, DashboardMetrics } from '@/types'

export async function logActivity(params: {
  entity_type: string
  entity_id: string
  action: string
  description: string
  actor_id?: string
}): Promise<void> {
  await supabase.from('activity_log').insert(params)
}

export async function fetchRecentActivity(limit = 20): Promise<ActivityLog[]> {
  const { data, error } = await supabase
    .from('activity_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data || []
}

export async function fetchDashboardMetrics(): Promise<DashboardMetrics> {
  const today = new Date().toISOString().split('T')[0]
  const in7Days = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]

  const [activeRes, upcomingRes, overdueRes, unassignedRes, completedRes] = await Promise.all([
    // Active = pending + in_progress
    supabase
      .from('obligations')
      .select('id', { count: 'exact', head: true })
      .in('status', ['pending', 'in_progress']),

    // Upcoming = due within 7 days, not completed/cancelled
    supabase
      .from('obligations')
      .select('id', { count: 'exact', head: true })
      .in('status', ['pending', 'in_progress'])
      .not('due_date', 'is', null)
      .lte('due_date', in7Days)
      .gte('due_date', today),

    // Overdue = due_date < today, not completed/cancelled
    supabase
      .from('obligations')
      .select('id', { count: 'exact', head: true })
      .in('status', ['pending', 'in_progress'])
      .not('due_date', 'is', null)
      .lt('due_date', today),

    // Unassigned = no owner, not completed/cancelled
    supabase
      .from('obligations')
      .select('id', { count: 'exact', head: true })
      .in('status', ['pending', 'in_progress'])
      .is('owner_id', null),

    // Completed
    supabase
      .from('obligations')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'completed'),
  ])

  return {
    totalActiveObligations: activeRes.count ?? 0,
    upcomingDeadlines: upcomingRes.count ?? 0,
    overdueObligations: overdueRes.count ?? 0,
    unassignedObligations: unassignedRes.count ?? 0,
    completedObligations: completedRes.count ?? 0,
  }
}
