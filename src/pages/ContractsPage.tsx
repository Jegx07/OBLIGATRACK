import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Plus, Search, FileText, ChevronRight, AlertTriangle } from 'lucide-react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Card, CardContent } from '@/components/ui/card'
import { PageHeader } from '@/components/shared/PageHeader'
import { TableSkeleton, ErrorMessage, EmptyState, NoResultsState } from '@/components/shared/States'
import { ContractStatusBadge } from '@/components/shared/Badges'
import { ContractForm } from '@/components/contracts/ContractForm'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { AnimateIn } from '@/components/motion/AnimateIn'
import { fetchContracts, createContract, deleteContract } from '@/data/contracts'
import { useToast } from '@/hooks/useToast'
import { format, parseISO, isPast, differenceInCalendarDays } from 'date-fns'
import type { Contract, ContractInsert, ContractStatus } from '@/types'

const easeOut = [0.16, 1, 0.3, 1]

export default function ContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<ContractStatus | 'all'>('all')
  const [createOpen, setCreateOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const navigate = useNavigate()
  const { toast } = useToast()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    const s = searchParams.get('status')
    if (s) setStatusFilter(s as ContractStatus)
  }, [])

  const load = async () => {
    setLoading(true); setError(null)
    try {
      const data = await fetchContracts({
        status: statusFilter === 'all' ? undefined : statusFilter,
        search: search || undefined,
      })
      setContracts(data)
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [statusFilter, search])

  const handleCreate = async (data: ContractInsert) => {
    setSaving(true)
    try {
      await createContract(data)
      toast({ title: 'Contract created successfully' })
      setCreateOpen(false)
      load()
    } catch (e: any) { toast({ variant: 'destructive', title: 'Error', description: e.message }) }
    finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteContract(id)
      toast({ title: 'Contract deleted' })
      load()
    } catch (e: any) { toast({ variant: 'destructive', title: 'Cannot delete', description: e.message }) }
  }

  const hasFilters = search || statusFilter !== 'all'

  return (
    <div className="space-y-5">
      <AnimateIn direction="down" duration={0.25}>
        <PageHeader
          title="Contracts"
          description={`${contracts.length} contract${contracts.length !== 1 ? 's' : ''} recorded`}
          actions={
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" /> New Contract
            </Button>
          }
        />
      </AnimateIn>

      {/* Filters */}
      <AnimateIn direction="up" delay={0.05}>
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9 bg-card"
              placeholder="Search contracts…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={v => setStatusFilter(v as any)}>
            <SelectTrigger className="w-40 bg-card">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
              <SelectItem value="terminated">Terminated</SelectItem>
            </SelectContent>
          </Select>
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setStatusFilter('all') }}>
              Clear
            </Button>
          )}
        </div>
      </AnimateIn>

      {loading && <TableSkeleton rows={5} cols={6} />}
      {error && <ErrorMessage message={error} onRetry={load} />}
      {!loading && !error && contracts.length === 0 && (
        hasFilters
          ? <NoResultsState onClear={() => { setSearch(''); setStatusFilter('all') }} />
          : <EmptyState
              icon={FileText}
              title="No contracts yet"
              description="Create your first contract to start tracking obligations."
              action={<Button onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4" /> New Contract</Button>}
            />
      )}

      {!loading && !error && contracts.length > 0 && (
        <AnimateIn direction="up" delay={0.08}>
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Reference</th>
                    <th>Title</th>
                    <th>Parties</th>
                    <th>End Date</th>
                    <th>Renewal</th>
                    <th>Status</th>
                    <th className="w-10" />
                  </tr>
                </thead>
                <tbody>
                  {contracts.map((c, i) => {
                    const expiredActive = c.status === 'active' && isPast(parseISO(c.end_date))
                    const renewalSoon = c.renewal_date && differenceInCalendarDays(parseISO(c.renewal_date), new Date()) <= 30
                    return (
                      <motion.tr
                        key={c.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.035, duration: 0.3, ease: easeOut }}
                        onClick={() => navigate(`/contracts/${c.id}`)}
                        className="cursor-pointer"
                      >
                        <td>
                          <span className="font-mono text-xs text-muted-foreground bg-muted/60 rounded px-1.5 py-0.5">
                            {c.contract_reference}
                          </span>
                        </td>
                        <td>
                          <div className="font-medium text-sm">{c.title}</div>
                          {expiredActive && (
                            <div className="flex items-center gap-1 text-[11px] text-orange-600 mt-0.5">
                              <AlertTriangle className="h-3 w-3" /> End date passed — verify status
                            </div>
                          )}
                        </td>
                        <td>
                          <div className="text-xs text-muted-foreground">
                            <span className="font-medium text-foreground">{c.first_party}</span>
                            <span className="mx-1 text-border">·</span>
                            {c.second_party}
                          </div>
                        </td>
                        <td className="text-sm text-muted-foreground">
                          {format(parseISO(c.end_date), 'dd MMM yyyy')}
                        </td>
                        <td>
                          {c.renewal_date ? (
                            <span className={`text-xs ${renewalSoon ? 'text-amber-600 font-medium' : 'text-muted-foreground'}`}>
                              {format(parseISO(c.renewal_date), 'dd MMM yyyy')}
                              {renewalSoon && <span className="ml-1 text-amber-600">· soon</span>}
                            </span>
                          ) : <span className="text-xs text-muted-foreground/50">—</span>}
                        </td>
                        <td><ContractStatusBadge status={c.status} /></td>
                        <td onClick={e => e.stopPropagation()}>
                          <div className="flex items-center gap-1">
                            <ConfirmDialog
                              trigger={
                                <Button variant="ghost" size="icon-sm" className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity">
                                  ×
                                </Button>
                              }
                              title="Delete this contract?"
                              description="Contracts with obligations cannot be deleted. This action is permanent."
                              confirmLabel="Delete" destructive onConfirm={() => handleDelete(c.id)}
                            />
                            <ChevronRight className="h-4 w-4 text-muted-foreground/40" />
                          </div>
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
          <DialogHeader><DialogTitle>New Contract</DialogTitle></DialogHeader>
          <ContractForm onSubmit={handleCreate} onCancel={() => setCreateOpen(false)} loading={saving} />
        </DialogContent>
      </Dialog>
    </div>
  )
}
