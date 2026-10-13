import { useEffect, useState } from 'react'
import { Download, BarChart2 } from 'lucide-react'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/shared/PageHeader'
import { LoadingSpinner, ErrorMessage } from '@/components/shared/States'
import { DeadlineBadge, PriorityBadge } from '@/components/shared/Badges'
import { AnimateIn, StaggerChildren, StaggerItem } from '@/components/motion/AnimateIn'
import { fetchObligations } from '@/data/obligations'
import { fetchContracts } from '@/data/contracts'
import { format, parseISO } from 'date-fns'
import type { ObligationWithDetails, Contract } from '@/types'

const CHART_COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316']

function exportCSV(obligations: ObligationWithDetails[]) {
  const headers = ['Title', 'Contract', 'Owner', 'Due Date', 'Priority', 'Status', 'Type']
  const rows = obligations.map(o => [
    o.title, o.contract?.title ?? '', o.owner?.full_name ?? 'Unassigned',
    o.due_date ?? '', o.priority, o.status, o.obligation_type,
  ])
  const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = `obligations-${new Date().toISOString().split('T')[0]}.csv`
  a.click(); URL.revokeObjectURL(url)
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-card border border-border rounded-lg shadow-lg px-3 py-2 text-xs">
      <p className="font-medium mb-1">{label || payload[0]?.name}</p>
      <p className="text-muted-foreground">Count: <span className="font-semibold text-foreground">{payload[0]?.value}</span></p>
    </div>
  )
}

export default function ReportsPage() {
  const [obligations, setObligations] = useState<ObligationWithDetails[]>([])
  const [contracts, setContracts] = useState<Contract[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    setLoading(true); setError(null)
    try {
      const [obs, ctrs] = await Promise.all([fetchObligations(), fetchContracts()])
      setObligations(obs); setContracts(ctrs)
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  if (loading) return <LoadingSpinner text="Loading reports…" />
  if (error) return <ErrorMessage message={error} onRetry={load} />

  const today = new Date().toISOString().split('T')[0]
  const in7  = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
  const in30 = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]

  const active    = obligations.filter(o => !['completed','cancelled'].includes(o.status))
  const overdue   = active.filter(o => o.due_date && o.due_date < today)
  const dueToday  = active.filter(o => o.due_date === today)
  const dueIn3    = active.filter(o => o.due_date && o.due_date > today && o.due_date <= new Date(Date.now()+3*86400000).toISOString().split('T')[0])
  const dueIn7    = active.filter(o => o.due_date && o.due_date > today && o.due_date <= in7)
  const unassigned = active.filter(o => !o.owner_id)
  const upcomingRenewals = contracts.filter(c => c.renewal_date && c.renewal_date >= today && c.renewal_date <= in30)
  const attention = [...overdue, ...dueToday, ...dueIn3]

  const byStatus = (['pending','in_progress','completed','cancelled'] as const)
    .map(s => ({ name: s === 'in_progress' ? 'In Progress' : s.charAt(0).toUpperCase() + s.slice(1), value: obligations.filter(o => o.status === s).length }))
    .filter(x => x.value > 0)

  const byPriority = (['low','medium','high','critical'] as const)
    .map(p => ({ name: p.charAt(0).toUpperCase() + p.slice(1), value: obligations.filter(o => o.priority === p).length }))
    .filter(x => x.value > 0)

  const byType = (['payment','delivery','reporting','renewal','compliance','service','other'] as const)
    .map(t => ({ name: t.charAt(0).toUpperCase() + t.slice(1), value: obligations.filter(o => o.obligation_type === t).length }))
    .filter(x => x.value > 0)

  const summaryStats = [
    { label: 'Overdue', value: overdue.length, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Due Today', value: dueToday.length, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Due ≤7 Days', value: dueIn7.length, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Unassigned', value: unassigned.length, color: 'text-gray-600', bg: 'bg-gray-50' },
  ]

  return (
    <div className="space-y-6">
      <AnimateIn direction="down" duration={0.25}>
        <PageHeader
          title="Reports"
          description="Obligation analytics, deadline monitoring, and data export."
          actions={
            <Button variant="outline" onClick={() => exportCSV(obligations)}>
              <Download className="h-4 w-4" /> Export CSV
            </Button>
          }
        />
      </AnimateIn>

      {/* Summary stats */}
      <StaggerChildren className="grid grid-cols-2 sm:grid-cols-4 gap-4" staggerDelay={0.06}>
        {summaryStats.map(s => (
          <StaggerItem key={s.label}>
            <Card className="text-center p-5">
              <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </Card>
          </StaggerItem>
        ))}
      </StaggerChildren>

      {/* Charts */}
      <StaggerChildren className="grid grid-cols-1 lg:grid-cols-3 gap-5" staggerDelay={0.08} baseDelay={0.1}>
        <StaggerItem>
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><BarChart2 className="h-4 w-4 text-muted-foreground" />By Status</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={byStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={72} innerRadius={36}
                    label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                    {byStatus.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </StaggerItem>

        <StaggerItem>
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><BarChart2 className="h-4 w-4 text-muted-foreground" />By Priority</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={byPriority} barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted))' }} />
                  <Bar dataKey="value" radius={[4,4,0,0]} fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </StaggerItem>

        <StaggerItem>
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><BarChart2 className="h-4 w-4 text-muted-foreground" />By Type</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={byType} layout="vertical" barSize={14}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} width={68} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted))' }} />
                  <Bar dataKey="value" radius={[0,4,4,0]} fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </StaggerItem>
      </StaggerChildren>

      {/* Overdue & Upcoming table */}
      <AnimateIn direction="up" delay={0.2}>
        <Card>
          <CardHeader>
            <CardTitle>Overdue & Upcoming Obligations</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {attention.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No overdue or urgent obligations.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Obligation</th>
                      <th>Contract</th>
                      <th>Due Date</th>
                      <th>Deadline</th>
                      <th>Priority</th>
                      <th>Owner</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attention.slice(0, 20).map(o => (
                      <tr key={o.id}>
                        <td className="font-medium text-sm">{o.title}</td>
                        <td className="text-xs text-muted-foreground">{o.contract?.title}</td>
                        <td className="text-sm text-muted-foreground">{o.due_date ? format(parseISO(o.due_date), 'dd MMM yyyy') : '—'}</td>
                        <td><DeadlineBadge obligation={o} /></td>
                        <td><PriorityBadge priority={o.priority} /></td>
                        <td>{o.owner?.full_name ?? <span className="text-xs text-orange-600">Unassigned</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </AnimateIn>

      {/* Upcoming Renewals */}
      <AnimateIn direction="up" delay={0.25}>
        <Card>
          <CardHeader><CardTitle>Upcoming Contract Renewals (30 days)</CardTitle></CardHeader>
          <CardContent className="p-0">
            {upcomingRenewals.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No renewals in the next 30 days.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Contract</th>
                      <th>Reference</th>
                      <th>Parties</th>
                      <th>Renewal Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {upcomingRenewals.map(c => (
                      <tr key={c.id}>
                        <td className="font-medium text-sm">{c.title}</td>
                        <td><span className="font-mono text-xs text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded">{c.contract_reference}</span></td>
                        <td className="text-xs text-muted-foreground">{c.first_party} · {c.second_party}</td>
                        <td className="text-sm">{format(parseISO(c.renewal_date!), 'dd MMM yyyy')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </AnimateIn>
    </div>
  )
}
