import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit2, Trash2, Quote } from 'lucide-react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { PageHeader } from '@/components/shared/PageHeader'
import { TableSkeleton, ErrorMessage } from '@/components/shared/States'
import { ObligationStatusBadge, PriorityBadge, DeadlineBadge, RiskBadge } from '@/components/shared/Badges'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { ObligationForm } from '@/components/obligations/ObligationForm'
import { AnimateIn, StaggerChildren, StaggerItem } from '@/components/motion/AnimateIn'
import { fetchObligationById, updateObligation, deleteObligation } from '@/data/obligations'
import { scoreRisk } from '@/lib/riskEngine'
import { daysUntilDue } from '@/lib/deadlineEngine'
import { useToast } from '@/hooks/useToast'
import { format, parseISO } from 'date-fns'
import type { ObligationWithDetails, ObligationUpdate } from '@/types'

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-border/40 last:border-0">
      <span className="text-xs text-muted-foreground w-32 shrink-0 pt-0.5">{label}</span>
      <span className="text-sm font-medium flex-1">{children}</span>
    </div>
  )
}

export default function ObligationDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [obligation, setObligation] = useState<ObligationWithDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    if (!id) return
    setLoading(true); setError(null)
    try { setObligation(await fetchObligationById(id)) }
    catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [id])

  const handleEdit = async (data: ObligationUpdate) => {
    if (!id) return
    setSaving(true)
    try {
      await updateObligation(id, data)
      toast({ title: 'Obligation updated' })
      setEditOpen(false); load()
    } catch (e: any) { toast({ variant: 'destructive', title: 'Error', description: e.message }) }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!id) return
    try {
      await deleteObligation(id)
      toast({ title: 'Obligation deleted' })
      navigate('/obligations')
    } catch (e: any) { toast({ variant: 'destructive', title: 'Error', description: e.message }) }
  }

  if (loading) return (
    <div className="space-y-5">
      <div className="h-8 w-32 rounded-lg bg-muted skeleton-shimmer" />
      <TableSkeleton rows={3} cols={2} />
    </div>
  )
  if (error) return <ErrorMessage message={error} onRetry={load} />
  if (!obligation) return <ErrorMessage message="Obligation not found." />

  const risk = scoreRisk(obligation)
  const days = daysUntilDue(obligation)

  return (
    <div className="space-y-5">
      <AnimateIn direction="down" duration={0.25}>
        <Button variant="ghost" size="sm" onClick={() => navigate('/obligations')} className="text-muted-foreground -ml-1 mb-1">
          <ArrowLeft className="h-4 w-4" /> Back to Obligations
        </Button>
        <PageHeader
          title={obligation.title}
          description={obligation.contract?.title}
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
                title="Delete obligation?" description="This will permanently delete this obligation."
                confirmLabel="Delete" destructive onConfirm={handleDelete}
              />
            </div>
          }
        />
      </AnimateIn>

      {/* Status flags */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
        className="flex flex-wrap gap-2">
        <DeadlineBadge obligation={obligation} />
        <PriorityBadge priority={obligation.priority} />
        <ObligationStatusBadge status={obligation.status} />
        <RiskBadge level={risk.level} />
        {!obligation.owner_id && (
          <span className="status-pill bg-orange-50 text-orange-700 border-orange-200">No owner assigned</span>
        )}
        {!obligation.due_date && (
          <span className="status-pill bg-amber-50 text-amber-700 border-amber-200">No due date</span>
        )}
      </motion.div>

      <StaggerChildren className="grid grid-cols-1 lg:grid-cols-2 gap-5" staggerDelay={0.08} baseDelay={0.15}>
        {/* Details */}
        <StaggerItem>
          <Card>
            <CardHeader><CardTitle>Obligation Details</CardTitle></CardHeader>
            <CardContent className="pt-2">
              <InfoRow label="Contract">
                <button onClick={() => navigate(`/contracts/${obligation.contract_id}`)} className="text-primary hover:underline text-left">
                  {obligation.contract?.title ?? '—'}
                </button>
              </InfoRow>
              <InfoRow label="Type"><span className="capitalize">{obligation.obligation_type}</span></InfoRow>
              <InfoRow label="External Party">{obligation.responsible_party ?? <span className="text-muted-foreground/50">Not specified</span>}</InfoRow>
              <InfoRow label="Internal Owner">
                {obligation.owner?.full_name ?? (
                  <span className="text-orange-600 font-medium">Unassigned — requires assignment</span>
                )}
              </InfoRow>
              {obligation.structured_description && (
                <InfoRow label="Description">{obligation.structured_description}</InfoRow>
              )}
              {obligation.notes && <InfoRow label="Notes">{obligation.notes}</InfoRow>}
            </CardContent>
          </Card>
        </StaggerItem>

        <div className="space-y-4">
          {/* Dates */}
          <StaggerItem>
            <Card>
              <CardHeader><CardTitle>Dates & Deadlines</CardTitle></CardHeader>
              <CardContent className="pt-2">
                {obligation.trigger_type && (
                  <InfoRow label="Trigger Type">
                    <span className="capitalize">{obligation.trigger_type.replace(/_/g, ' ')}</span>
                  </InfoRow>
                )}
                {obligation.trigger_date && (
                  <InfoRow label="Trigger Date">{format(parseISO(obligation.trigger_date), 'dd MMMM yyyy')}</InfoRow>
                )}
                {obligation.duration_days !== null && (
                  <InfoRow label="Duration">{obligation.duration_days} calendar days</InfoRow>
                )}
                <InfoRow label="Due Date">
                  {obligation.due_date ? (
                    <span>
                      {format(parseISO(obligation.due_date), 'dd MMMM yyyy')}
                      {days !== null && (
                        <span className={`ml-2 text-xs font-medium ${days < 0 ? 'text-red-600' : days <= 3 ? 'text-orange-600' : 'text-muted-foreground'}`}>
                          {days >= 0 ? `${days}d remaining` : `${Math.abs(days)}d overdue`}
                        </span>
                      )}
                    </span>
                  ) : <span className="text-amber-600">Not confirmed</span>}
                </InfoRow>
                {obligation.reminder_date && (
                  <InfoRow label="Reminder">{format(parseISO(obligation.reminder_date), 'dd MMMM yyyy')}</InfoRow>
                )}
              </CardContent>
            </Card>
          </StaggerItem>

          {/* Risk */}
          <StaggerItem>
            <Card>
              <CardHeader><CardTitle>
                Risk Factors
                <span className={`ml-2 text-xs font-mono px-1.5 py-0.5 rounded ${risk.level === 'high' ? 'bg-red-100 text-red-700' : risk.level === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                  {risk.score}/100
                </span>
              </CardTitle></CardHeader>
              <CardContent className="pt-2">
                <p className="text-xs text-muted-foreground mb-3">Operational prioritisation indicator — not a legal risk assessment.</p>
                {risk.reasons.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No risk factors identified.</p>
                ) : (
                  <ul className="space-y-1.5">
                    {risk.reasons.map((r, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <span className="h-1.5 w-1.5 rounded-full bg-destructive/70 shrink-0" />
                        {r}
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </StaggerItem>
        </div>
      </StaggerChildren>

      {obligation.original_clause && (
        <AnimateIn direction="up" delay={0.25}>
          <Card>
            <CardHeader className="flex flex-row items-center gap-2 pb-0">
              <Quote className="h-4 w-4 text-muted-foreground" />
              <CardTitle>Original Clause</CardTitle>
            </CardHeader>
            <CardContent className="pt-3">
              <blockquote className="text-sm text-muted-foreground italic border-l-4 border-primary/30 pl-4 leading-relaxed">
                {obligation.original_clause}
              </blockquote>
            </CardContent>
          </Card>
        </AnimateIn>
      )}

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit Obligation</DialogTitle></DialogHeader>
          <ObligationForm initial={obligation} onSubmit={handleEdit} onCancel={() => setEditOpen(false)} loading={saving} />
        </DialogContent>
      </Dialog>
    </div>
  )
}
