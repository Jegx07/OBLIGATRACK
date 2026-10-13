import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Plus, Search, ClipboardList, ChevronRight, SlidersHorizontal } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Card } from '@/components/ui/card'
import { PageHeader } from '@/components/shared/PageHeader'
import { TableSkeleton, ErrorMessage, EmptyState, NoResultsState } from '@/components/shared/States'
import { ObligationStatusBadge, PriorityBadge, DeadlineBadge, RiskBadge } from '@/components/shared/Badges'
import { ObligationForm } from '@/components/obligations/ObligationForm'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { AnimateIn } from '@/components/motion/AnimateIn'
import { fetchObligations, createObligation, deleteObligation } from '@/data/obligations'
import { fetchContracts } from '@/data/contracts'
import { fetchProfiles } from '@/data/profiles'
import { scoreRisk } from '@/lib/riskEngine'
import { classifyDeadline } from '@/lib/deadlineEngine'
import { useToast } from '@/hooks/useToast'
import { format, parseISO } from 'date-fns'
import type { ObligationWithDetails, ObligationInsert, ObligationStatus, ObligationPriority, Contract, Profile } from '@/types'

const easeOut = [0.16, 1, 0.3, 1]

export default function ObligationsPage() {
  const [obligations, setObligations] = useState<ObligationWithDetails[]>([])
  const [contracts, setContracts] = useState<Contract[]>([])
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const navigate = useNavigate()
  const { toast } = useToast()
  const [searchParams] = useSearchParams()

  const [search, setSearch] = useState('')
  const [contractFilter, setContractFilter] = useState(searchParams.get('contract_id') ?? 'all')
  const [ownerFilter, setOwnerFilter] = useState(searchParams.get('owner_id') ?? 'all')
  const [priorityFilter, setPriorityFilter] = useState<ObligationPriority | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<ObligationStatus | 'all'>((searchParams.get('status') as ObligationStatus) ?? 'all')
  const [deadlineFilter, setDeadlineFilter] = useState(searchParams.get('deadline') ?? 'all')

  useEffect(() => {
    fetchContracts().then(setContracts)
    fetchProfiles().then(setProfiles)
  }, [])

  const load = async () => {
    setLoading(true); setError(null)
    try {
      const data = await fetchObligations({
        search: search || undefined,
        contract_id: contractFilter !== 'all' ? contractFilter : undefined,
        owner_id: ownerFilter !== 'all' ? (ownerFilter as any) : undefined,
        priority: priorityFilter !== 'all' ? priorityFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      })
      const filtered = deadlineFilter === 'all' ? data : data.filter(o => classifyDeadline(o) === deadlineFilter)
      setObligations(filtered)
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [search, contractFilter, ownerFilter, priorityFilter, statusFilter, deadlineFilter])

  const handleCreate = async (data: ObligationInsert) => {
    setSaving(true)
    try {
      await createObligation(data)
      toast({ title: 'Obligation created' })
      setCreateOpen(false); load()
    } catch (e: any) { toast({ variant: 'destructive', title: 'Error', description: e.message }) }
    finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteObligation(id)
      toast({ title: 'Obligation deleted' })
      load()
    } catch (e: any) { toast({ variant: 'destructive', title: 'Error', description: e.message }) }
  }

  const clearFilters = () => { setSearch(''); setContractFilter('all'); setOwnerFilter('all'); setPriorityFilter('all'); setStatusFilter('all'); setDeadlineFilter('all') }
  const hasFilters = search || contractFilter !== 'all' || ownerFilter !== 'all' || priorityFilter !== 'all' || statusFilter !== 'all' || deadlineFilter !== 'all'
  const defaultContractId = searchParams.get('contract_id') ?? undefined

  return (
    <div className="space-y-5">
      <AnimateIn direction="down" duration={0.25}>
        <PageHeader
          title="Obligations"
          description={`${obligations.length} obligation${obligations.length !== 1 ? 's' : ''}${hasFilters ? ' (filtered)' : ''}`}
          actions={
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowFilters(v => !v)}>
                <SlidersHorizontal className="h-3.5 w-3.5" /> Filters
                {hasFilters && <span className="ml-1 h-1.5 w-1.5 rounded-full bg-primary" />}
              </Button>
              <Button onClick={() => setCreateOpen(true)}>
                <Plus className="h-4 w-4" /> New Obligation
              </Button>
            </div>
          }
        />
      </AnimateIn>

      {/* Search bar always visible */}
      <AnimateIn direction="up" delay={0.05}>
        <div className="flex gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9 bg-card" placeholder="Search obligations…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          {hasFilters && <Button variant="ghost" size="sm" onClick={clearFilters}>Clear all</Button>}
        </div>

        {/* Collapsible filter row */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2, ease: easeOut }}
              className="overflow-hidden"
            >
              <div className="flex flex-wrap gap-2.5 mt-3 pt-3 border-t border-border/40">
                <Select value={contractFilter} onValueChange={setContractFilter}>
                  <SelectTrigger className="w-48 bg-card h-8 text-xs"><SelectValue placeholder="All Contracts" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Contracts</SelectItem>
                    {contracts.map(c => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={ownerFilter} onValueChange={setOwnerFilter}>
                  <SelectTrigger className="w-44 bg-card h-8 text-xs"><SelectValue placeholder="All Owners" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Owners</SelectItem>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {profiles.map(p => <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={priorityFilter} onValueChange={v => setPriorityFilter(v as any)}>
                  <SelectTrigger className="w-36 bg-card h-8 text-xs"><SelectValue placeholder="Priority" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={v => setStatusFilter(v as any)}>
                  <SelectTrigger className="w-40 bg-card h-8 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={deadlineFilter} onValueChange={setDeadlineFilter}>
                  <SelectTrigger className="w-40 bg-card h-8 text-xs"><SelectValue placeholder="Deadline" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Deadlines</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                    <SelectItem value="due_today">Due Today</SelectItem>
                    <SelectItem value="urgent">Urgent (≤3d)</SelectItem>
                    <SelectItem value="approaching">Approaching (≤7d)</SelectItem>
                    <SelectItem value="no_deadline">No Deadline</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </AnimateIn>

      {loading && <TableSkeleton rows={6} cols={8} />}
      {error && <ErrorMessage message={error} onRetry={load} />}
      {!loading && !error && obligations.length === 0 && (
        hasFilters
          ? <NoResultsState onClear={clearFilters} />
          : <EmptyState icon={ClipboardList} title="No obligations yet" description="Create obligations under contracts to start tracking deadlines." action={<Button onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4" /> New Obligation</Button>} />
      )}

      {!loading && !error && obligations.length > 0 && (
        <AnimateIn direction="up" delay={0.08}>
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Obligation</th>
                    <th>Contract</th>
                    <th>Owner</th>
                    <th>Due Date</th>
                    <th>Deadline</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Risk</th>
                    <th className="w-8" />
                  </tr>
                </thead>
                <tbody>
                  {obligations.map((o, i) => {
                    const risk = scoreRisk(o)
                    return (
                      <motion.tr
                        key={o.id}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.025, duration: 0.28, ease: easeOut }}
                        onClick={() => navigate(`/obligations/${o.id}`)}
                        className="cursor-pointer group"
                      >
                        <td>
                          <div className="font-medium text-sm leading-snug">{o.title}</div>
                          <div className="text-xs text-muted-foreground capitalize mt-0.5">{o.obligation_type}</div>
                        </td>
                        <td className="text-xs text-muted-foreground max-w-[140px] truncate">{o.contract?.title ?? '—'}</td>
                        <td>
                          {o.owner
                            ? <span className="text-sm">{o.owner.full_name}</span>
                            : <span className="text-xs font-medium text-orange-600 bg-orange-50 border border-orange-200 rounded-full px-2 py-0.5">Unassigned</span>}
                        </td>
                        <td className="text-sm text-muted-foreground whitespace-nowrap">
                          {o.due_date ? format(parseISO(o.due_date), 'dd MMM yyyy') : <span className="text-muted-foreground/40 text-xs">Not set</span>}
                        </td>
                        <td><DeadlineBadge obligation={o} /></td>
                        <td><PriorityBadge priority={o.priority} /></td>
                        <td><ObligationStatusBadge status={o.status} /></td>
                        <td><RiskBadge level={risk.level} /></td>
                        <td onClick={e => e.stopPropagation()}>
                          <ConfirmDialog
                            trigger={<Button variant="ghost" size="icon-sm" className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity">×</Button>}
                            title="Delete obligation?"
                            description="This will permanently delete this obligation."
                            confirmLabel="Delete" destructive onConfirm={() => handleDelete(o.id)}
                          />
                        </td>
                      </motion.tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </AnimateIn>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>New Obligation</DialogTitle></DialogHeader>
          <ObligationForm defaultContractId={defaultContractId} onSubmit={handleCreate} onCancel={() => setCreateOpen(false)} loading={saving} />
        </DialogContent>
      </Dialog>
    </div>
  )
}
