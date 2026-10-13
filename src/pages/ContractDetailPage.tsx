import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit2, Trash2, Plus, AlertTriangle, ExternalLink } from 'lucide-react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/shared/PageHeader'
import { TableSkeleton, ErrorMessage } from '@/components/shared/States'
import { ContractStatusBadge, DeadlineBadge, PriorityBadge, ObligationStatusBadge } from '@/components/shared/Badges'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { ContractForm } from '@/components/contracts/ContractForm'
import { AnimateIn, StaggerChildren, StaggerItem } from '@/components/motion/AnimateIn'
import { fetchContractById, updateContract, deleteContract } from '@/data/contracts'
import { fetchObligations } from '@/data/obligations'
import { useToast } from '@/hooks/useToast'
import { format, parseISO, isPast, differenceInCalendarDays } from 'date-fns'
import type { Contract, ContractUpdate, ObligationWithDetails } from '@/types'

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-border/40 last:border-0">
      <span className="text-xs text-muted-foreground w-28 shrink-0 pt-0.5">{label}</span>
      <span className="text-sm font-medium flex-1">{children}</span>
    </div>
  )
}

export default function ContractDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [contract, setContract] = useState<Contract | null>(null)
  const [obligations, setObligations] = useState<ObligationWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    if (!id) return
    setLoading(true); setError(null)
    try {
      const [c, obs] = await Promise.all([fetchContractById(id), fetchObligations({ contract_id: id })])
      setContract(c); setObligations(obs)
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [id])

  const handleEdit = async (data: ContractUpdate) => {
    if (!id) return
    setSaving(true)
    try {
      await updateContract(id, data)
      toast({ title: 'Contract updated' })
      setEditOpen(false); load()
    } catch (e: any) { toast({ variant: 'destructive', title: 'Error', description: e.message }) }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!id) return
    try {
      await deleteContract(id)
      toast({ title: 'Contract deleted' })
      navigate('/contracts')
    } catch (e: any) { toast({ variant: 'destructive', title: 'Cannot delete', description: e.message }) }
  }

  if (loading) return (
    <div className="space-y-5">
      <div className="h-8 w-32 rounded-lg bg-muted skeleton-shimmer" />
      <TableSkeleton rows={4} cols={2} />
    </div>
  )
  if (error) return <ErrorMessage message={error} onRetry={load} />
  if (!contract) return <ErrorMessage message="Contract not found." />

  const expiredActive = contract.status === 'active' && isPast(parseISO(contract.end_date))
  const renewalDays = contract.renewal_date ? differenceInCalendarDays(parseISO(contract.renewal_date), new Date()) : null
  const activeObs = obligations.filter(o => !['completed', 'cancelled'].includes(o.status))

  return (
    <div className="space-y-5">
      <AnimateIn direction="down" duration={0.25}>
        <Button variant="ghost" size="sm" onClick={() => navigate('/contracts')} className="text-muted-foreground -ml-1 mb-1">
          <ArrowLeft className="h-4 w-4" /> Back to Contracts
        </Button>
        <PageHeader
          title={contract.title}
          description={contract.contract_reference}
          badge={<ContractStatusBadge status={contract.status} />}
          actions={
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
                <Edit2 className="h-3.5 w-3.5" /> Edit
              </Button>
              <ConfirmDialog
                trigger={
                  <Button variant="outline" size="sm" className="text-destructive border-destructive/30 hover:bg-destructive/5">
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </Button>
                }
                title="Delete this contract?"
                description={`"${contract.title}" has ${obligations.length} obligation(s). Contracts with obligations cannot be deleted.`}
                confirmLabel="Delete" destructive onConfirm={handleDelete}
              />
            </div>
          }
        />
      </AnimateIn>

      {expiredActive && (
        <motion.div
          initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-3 p-4 rounded-xl bg-orange-50 border border-orange-200"
        >
          <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-orange-800">End date has passed</p>
            <p className="text-xs text-orange-700 mt-0.5">This contract is marked as Active but its end date was {format(parseISO(contract.end_date), 'dd MMM yyyy')}. Please verify and update the status.</p>
          </div>
        </motion.div>
      )}

      {renewalDays !== null && renewalDays <= 30 && renewalDays >= 0 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200"
        >
          <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
          <p className="text-sm text-amber-800">Renewal date is in <strong>{renewalDays} day{renewalDays !== 1 ? 's' : ''}</strong> — {format(parseISO(contract.renewal_date!), 'dd MMM yyyy')}</p>
        </motion.div>
      )}

      <StaggerChildren className="grid grid-cols-1 lg:grid-cols-2 gap-5" staggerDelay={0.08} baseDelay={0.1}>
        {/* Contract details */}
        <StaggerItem>
          <Card>
            <CardHeader><CardTitle>Contract Details</CardTitle></CardHeader>
            <CardContent className="pt-2">
              <InfoRow label="Parties">
                <span>{contract.first_party} <span className="text-muted-foreground mx-1">·</span> {contract.second_party}</span>
              </InfoRow>
              <InfoRow label="Start Date">{format(parseISO(contract.start_date), 'dd MMMM yyyy')}</InfoRow>
              <InfoRow label="End Date">{format(parseISO(contract.end_date), 'dd MMMM yyyy')}</InfoRow>
              {contract.renewal_date && (
                <InfoRow label="Renewal Date">
                  <span className={renewalDays !== null && renewalDays <= 30 ? 'text-amber-600 font-semibold' : ''}>
                    {format(parseISO(contract.renewal_date), 'dd MMMM yyyy')}
                    {renewalDays !== null && ` (${renewalDays}d)`}
                  </span>
                </InfoRow>
              )}
              {contract.description && <InfoRow label="Description">{contract.description}</InfoRow>}
              {contract.notes && <InfoRow label="Notes">{contract.notes}</InfoRow>}
            </CardContent>
          </Card>
        </StaggerItem>

        {/* Obligations */}
        <StaggerItem>
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-0">
              <CardTitle>
                Obligations
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  {activeObs.length} active · {obligations.length} total
                </span>
              </CardTitle>
              <Button size="sm" variant="outline" onClick={() => navigate(`/obligations?contract_id=${contract.id}`)}>
                <Plus className="h-3.5 w-3.5" /> Add
              </Button>
            </CardHeader>
            <CardContent className="pt-3">
              {obligations.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No obligations recorded.</p>
              ) : (
                <div className="space-y-2">
                  {obligations.map(o => (
                    <motion.div
                      key={o.id}
                      whileHover={{ x: 2 }}
                      transition={{ duration: 0.15 }}
                      onClick={() => navigate(`/obligations/${o.id}`)}
                      className="flex items-center justify-between p-3 rounded-lg border border-border/60 hover:border-primary/30 hover:bg-muted/30 cursor-pointer transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{o.title}</p>
                        <div className="flex gap-1.5 mt-1.5 flex-wrap">
                          <ObligationStatusBadge status={o.status} />
                          <PriorityBadge priority={o.priority} />
                        </div>
                      </div>
                      <div className="ml-3 shrink-0">
                        <DeadlineBadge obligation={o} />
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </StaggerItem>
      </StaggerChildren>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit Contract</DialogTitle></DialogHeader>
          <ContractForm initial={contract} onSubmit={handleEdit} onCancel={() => setEditOpen(false)} loading={saving} />
        </DialogContent>
      </Dialog>
    </div>
  )
}
