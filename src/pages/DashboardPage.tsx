import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  AlertTriangle, CheckCircle2, Clock, UserX,
  Activity, TrendingUp, ArrowRight, Calendar,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DashboardSkeleton, ErrorMessage } from '@/components/shared/States'
import { DeadlineBadge, PriorityBadge, ObligationStatusBadge, RiskBadge } from '@/components/shared/Badges'
import { AnimateIn, StaggerChildren, StaggerItem } from '@/components/motion/AnimateIn'
import { fetchDashboardMetrics, fetchRecentActivity } from '@/data/activity'
import { fetchObligations } from '@/data/obligations'
import { fetchContracts } from '@/data/contracts'
import { scoreRisk } from '@/lib/riskEngine'
import { format, parseISO, differenceInCalendarDays } from 'date-fns'
import type { DashboardMetrics, ObligationWithDetails, Contract, ActivityLog } from '@/types'

const easeOut = [0.16, 1, 0.3, 1]

// Animated number counter
function CountUp({ value }: { value: number }) {
  return (
    <motion.span
      key={value}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: easeOut }}
      className="text-3xl font-bold tracking-tight"
    >
      {value}
    </motion.span>
  )
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [attentionItems, setAttentionItems] = useState<ObligationWithDetails[]>([])
  const [upcomingRenewals, setUpcomingRenewals] = useState<Contract[]>([])
  const [recentActivity, setRecentActivity] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    setLoading(true); setError(null)
    try {
      const today = new Date().toISOString().split('T')[0]
      const in30 = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
      const [m, allObs, contracts, activity] = await Promise.all([
        fetchDashboardMetrics(),
        fetchObligations(),
        fetchContracts(),
        fetchRecentActivity(10),
      ])
      setMetrics(m)
      setRecentActivity(activity)
      const attention = allObs
        .filter(o => !['completed', 'cancelled'].includes(o.status))
        .filter(o => scoreRisk(o).score >= 20)
        .sort((a, b) => scoreRisk(b).score - scoreRisk(a).score)
        .slice(0, 10)
      setAttentionItems(attention)
      setUpcomingRenewals(
        contracts.filter(c => c.renewal_date && c.renewal_date >= today && c.renewal_date <= in30)
          .sort((a, b) => a.renewal_date!.localeCompare(b.renewal_date!))
      )
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  if (loading) return <DashboardSkeleton />
  if (error) return <ErrorMessage message={error} onRetry={load} />

  const summaryCards = [
    { label: 'Active Obligations', value: metrics!.totalActiveObligations, icon: Activity, iconBg: 'bg-blue-100', iconColor: 'text-blue-600', link: '/obligations' },
    { label: 'Upcoming Deadlines', value: metrics!.upcomingDeadlines, icon: Clock, iconBg: 'bg-amber-100', iconColor: 'text-amber-600', link: '/obligations?deadline=approaching' },
    { label: 'Overdue', value: metrics!.overdueObligations, icon: AlertTriangle, iconBg: 'bg-red-100', iconColor: 'text-red-600', link: '/obligations?deadline=overdue', highlight: metrics!.overdueObligations > 0 },
    { label: 'Unassigned', value: metrics!.unassignedObligations, icon: UserX, iconBg: 'bg-orange-100', iconColor: 'text-orange-600', link: '/obligations?owner_id=unassigned', highlight: metrics!.unassignedObligations > 0 },
    { label: 'Completed', value: metrics!.completedObligations, icon: CheckCircle2, iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600', link: '/obligations?status=completed' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <AnimateIn direction="down" duration={0.3}>
        <div>
          <h1 className="text-xl font-semibold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {format(new Date(), 'EEEE, d MMMM yyyy')}
            {metrics!.overdueObligations > 0 && (
              <span className="ml-2 inline-flex items-center gap-1 text-red-600 font-medium">
                <AlertTriangle className="h-3.5 w-3.5" />
                {metrics!.overdueObligations} overdue obligation{metrics!.overdueObligations !== 1 ? 's' : ''} require attention
              </span>
            )}
          </p>
        </div>
      </AnimateIn>

      {/* Summary cards */}
      <StaggerChildren className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4" staggerDelay={0.06}>
        {summaryCards.map(card => (
          <StaggerItem key={card.label}>
            <motion.div
              whileHover={{ y: -2, boxShadow: 'var(--shadow-card-hover)' }}
              transition={{ duration: 0.18, ease: easeOut }}
              onClick={() => navigate(card.link)}
              className={`metric-card group ${card.highlight ? 'ring-1 ring-red-200' : ''}`}
            >
              <div className={`inline-flex p-2 rounded-lg ${card.iconBg} mb-3`}>
                <card.icon className={`h-4.5 w-4.5 ${card.iconColor}`} strokeWidth={2} />
              </div>
              <CountUp value={card.value} />
              <p className="text-xs text-muted-foreground mt-1 leading-snug">{card.label}</p>
              <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground/60 group-hover:text-primary transition-colors">
                <span>View all</span><ArrowRight className="h-3 w-3" />
              </div>
            </motion.div>
          </StaggerItem>
        ))}
      </StaggerChildren>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Attention required — 2 cols */}
        <AnimateIn className="lg:col-span-2" direction="up" delay={0.1}>
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-0">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-red-100">
                  <AlertTriangle className="h-3.5 w-3.5 text-red-600" />
                </div>
                <CardTitle>Attention Required</CardTitle>
                {attentionItems.length > 0 && (
                  <span className="text-xs font-semibold bg-red-100 text-red-700 rounded-full px-2 py-0.5">
                    {attentionItems.length}
                  </span>
                )}
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate('/obligations')} className="text-xs text-muted-foreground gap-1">
                View all <ArrowRight className="h-3 w-3" />
              </Button>
            </CardHeader>
            <CardContent className="p-0 mt-3">
              {attentionItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-2">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500/60" />
                  <p className="text-sm font-medium text-muted-foreground">All obligations are on track</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Obligation</th>
                        <th>Due</th>
                        <th>Owner</th>
                        <th>Priority</th>
                        <th>Risk</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attentionItems.map((o, i) => {
                        const risk = scoreRisk(o)
                        return (
                          <motion.tr
                            key={o.id}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.04, duration: 0.3, ease: easeOut }}
                            onClick={() => navigate(`/obligations/${o.id}`)}
                            className="border-b border-border/50 hover:bg-muted/30 cursor-pointer transition-colors"
                          >
                            <td className="px-4 py-3">
                              <div className="font-medium text-sm leading-snug">{o.title}</div>
                              <div className="text-xs text-muted-foreground mt-0.5 truncate max-w-[200px]">{o.contract?.title}</div>
                            </td>
                            <td className="px-4 py-3">
                              <DeadlineBadge obligation={o} />
                            </td>
                            <td className="px-4 py-3">
                              {o.owner
                                ? <span className="text-sm">{o.owner.full_name}</span>
                                : <span className="text-xs font-medium text-orange-600 bg-orange-50 border border-orange-200 rounded-full px-2 py-0.5">Unassigned</span>
                              }
                            </td>
                            <td className="px-4 py-3"><PriorityBadge priority={o.priority} /></td>
                            <td className="px-4 py-3"><RiskBadge level={risk.level} /></td>
                          </motion.tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </AnimateIn>

        {/* Right column */}
        <div className="space-y-5">
          {/* Upcoming Renewals */}
          <AnimateIn direction="up" delay={0.15}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-0">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-blue-100">
                    <TrendingUp className="h-3.5 w-3.5 text-blue-600" />
                  </div>
                  <CardTitle>Upcoming Renewals</CardTitle>
                </div>
                <Button variant="ghost" size="sm" onClick={() => navigate('/contracts')} className="text-xs text-muted-foreground gap-1">
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </CardHeader>
              <CardContent className="pt-3 px-0 pb-0">
                {upcomingRenewals.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-5 px-5">No renewals in the next 30 days.</p>
                ) : (
                  <div>
                    {upcomingRenewals.map(c => {
                      const daysLeft = differenceInCalendarDays(parseISO(c.renewal_date!), new Date())
                      return (
                        <div
                          key={c.id}
                          onClick={() => navigate(`/contracts/${c.id}`)}
                          className="flex items-center justify-between px-5 py-2.5 hover:bg-muted/30 cursor-pointer transition-colors border-b border-border/40 last:border-0"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{c.title}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {format(parseISO(c.renewal_date!), 'dd MMM yyyy')}
                            </p>
                          </div>
                          <span className={`text-xs font-semibold shrink-0 ml-3 px-2 py-0.5 rounded-full border ${daysLeft <= 7 ? 'bg-red-50 text-red-700 border-red-200' : daysLeft <= 14 ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                            {daysLeft}d
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </AnimateIn>

          {/* Recent Activity */}
          <AnimateIn direction="up" delay={0.2}>
            <Card>
              <CardHeader className="flex flex-row items-center gap-2 pb-0">
                <div className="p-1.5 rounded-md bg-gray-100">
                  <Activity className="h-3.5 w-3.5 text-gray-600" />
                </div>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent className="pt-3 px-0 pb-0">
                {recentActivity.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-5 px-5">No recent activity.</p>
                ) : (
                  <div>
                    {recentActivity.slice(0, 6).map(a => (
                      <div key={a.id} className="flex gap-3 px-5 py-2.5 border-b border-border/40 last:border-0">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary/40 mt-1.5 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs text-foreground leading-snug">{a.description}</p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            {format(parseISO(a.created_at), 'dd MMM, HH:mm')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </AnimateIn>
        </div>
      </div>
    </div>
  )
}
