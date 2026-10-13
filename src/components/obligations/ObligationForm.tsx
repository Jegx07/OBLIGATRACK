import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { AlertCircle, AlertTriangle, Wand2, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { validateObligationDates } from '@/lib/dateValidation'
import { extractClause } from '@/lib/clauseExtraction'
import { fetchContracts } from '@/data/contracts'
import { fetchProfiles } from '@/data/profiles'
import type { Obligation, ObligationInsert, ObligationType, ObligationPriority, ObligationStatus, TriggerType, Contract, Profile } from '@/types'

interface ObligationFormProps {
  initial?: Obligation
  defaultContractId?: string
  onSubmit: (data: ObligationInsert) => Promise<void>
  onCancel: () => void
  loading?: boolean
}

interface FormValues {
  contract_id: string; title: string
  original_clause: string; structured_description: string
  obligation_type: ObligationType; responsible_party: string; owner_id: string
  trigger_type: TriggerType | ''; trigger_date: string; duration_days: string
  due_date: string; reminder_date: string
  priority: ObligationPriority; status: ObligationStatus; notes: string
}

function Section({ label, sublabel, children }: { label: string; sublabel?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <div className="flex items-baseline gap-2">
        <p className="section-label">{label}</p>
        {sublabel && <span className="text-xs text-muted-foreground">{sublabel}</span>}
      </div>
      <div className="pl-0 space-y-3">{children}</div>
    </div>
  )
}

export function ObligationForm({ initial, defaultContractId, onSubmit, onCancel, loading }: ObligationFormProps) {
  const [contracts, setContracts] = useState<Contract[]>([])
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [dateWarnings, setDateWarnings] = useState<string[]>([])
  const [clauseWarnings, setClauseWarnings] = useState<string[]>([])
  const [contractStartDate, setContractStartDate] = useState<string | undefined>()

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormValues>({
    defaultValues: {
      contract_id: initial?.contract_id ?? defaultContractId ?? '',
      title: initial?.title ?? '',
      original_clause: initial?.original_clause ?? '',
      structured_description: initial?.structured_description ?? '',
      obligation_type: initial?.obligation_type ?? 'other',
      responsible_party: initial?.responsible_party ?? '',
      owner_id: initial?.owner_id ?? '__unassigned__',
      trigger_type: initial?.trigger_type ?? '',
      trigger_date: initial?.trigger_date ?? '',
      duration_days: initial?.duration_days?.toString() ?? '',
      due_date: initial?.due_date ?? '',
      reminder_date: initial?.reminder_date ?? '',
      priority: initial?.priority ?? 'medium',
      status: initial?.status ?? 'pending',
      notes: initial?.notes ?? '',
    },
  })

  const dueDate = watch('due_date')
  const reminderDate = watch('reminder_date')
  const contractId = watch('contract_id')

  useEffect(() => {
    fetchContracts().then(setContracts)
    fetchProfiles().then(setProfiles)
  }, [])

  useEffect(() => {
    const c = contracts.find(x => x.id === contractId)
    setContractStartDate(c?.start_date)
  }, [contractId, contracts])

  useEffect(() => {
    const warns = validateObligationDates({ dueDate, reminderDate, contractStartDate })
    setDateWarnings(warns.filter(w => w.severity === 'warning').map(w => w.message))
  }, [dueDate, reminderDate, contractStartDate])

  const handleStructure = () => {
    const clause = watch('original_clause')
    if (!clause) return
    const result = extractClause(clause)
    if (result.title) setValue('title', result.title)
    if (result.structured_description) setValue('structured_description', result.structured_description)
    if (result.obligation_type) setValue('obligation_type', result.obligation_type)
    if (result.trigger_type) setValue('trigger_type', result.trigger_type)
    if (result.trigger_date) setValue('trigger_date', result.trigger_date)
    if (result.duration_days !== undefined) setValue('duration_days', String(result.duration_days))
    if (result.due_date) setValue('due_date', result.due_date)
    if (result.priority) setValue('priority', result.priority)
    setClauseWarnings(result.warnings)
  }

  const handleFormSubmit = async (values: FormValues) => {
    await onSubmit({
      contract_id: values.contract_id,
      title: values.title,
      original_clause: values.original_clause || null,
      structured_description: values.structured_description || null,
      obligation_type: values.obligation_type,
      responsible_party: values.responsible_party || null,
      owner_id: values.owner_id === '__unassigned__' ? null : values.owner_id || null,
      trigger_type: (values.trigger_type as TriggerType) || null,
      trigger_date: values.trigger_date || null,
      duration_days: values.duration_days ? parseInt(values.duration_days) : null,
      due_date: values.due_date || null,
      reminder_date: values.reminder_date || null,
      priority: values.priority,
      status: values.status,
      notes: values.notes || null,
    })
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-7">

      {/* A: Contract & Clause */}
      <Section label="A — Contract & Clause">
        <div className="field">
          <Label className="field-label">Contract *</Label>
          <Select defaultValue={initial?.contract_id ?? defaultContractId ?? ''} onValueChange={v => setValue('contract_id', v)}>
            <SelectTrigger><SelectValue placeholder="Select a contract…" /></SelectTrigger>
            <SelectContent>
              {contracts.map(c => <SelectItem key={c.id} value={c.id}>{c.title} <span className="text-muted-foreground ml-1">({c.contract_reference})</span></SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="field">
          <Label className="field-label">Original Clause</Label>
          <Textarea {...register('original_clause')} rows={3} placeholder="Paste the exact clause text from the contract…" />
          <p className="field-hint">Paste a clause and click Structure Clause to extract fields automatically.</p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={handleStructure} className="gap-2">
          <Wand2 className="h-3.5 w-3.5" /> Structure Clause
        </Button>
        {clauseWarnings.length > 0 && (
          <div className="space-y-1.5">
            {clauseWarnings.map((w, i) => (
              <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs">
                <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />{w}
              </div>
            ))}
            <div className="flex items-start gap-2 p-2.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 text-xs">
              <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              Structured fields require human review. ObligaTrack does not provide legal advice.
            </div>
          </div>
        )}
      </Section>

      {/* B: Obligation Details */}
      <Section label="B — Obligation Details">
        <div className="field">
          <Label className="field-label">Title *</Label>
          <Input {...register('title', { required: 'Required' })} placeholder="Short obligation title" />
          {errors.title && <p className="field-error">{errors.title.message}</p>}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="field">
            <Label className="field-label">Obligation Type</Label>
            <Select defaultValue={initial?.obligation_type ?? 'other'} onValueChange={v => setValue('obligation_type', v as ObligationType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {['payment','delivery','reporting','renewal','compliance','service','other'].map(t => (
                  <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="field">
            <Label className="field-label">Structured Description</Label>
            <Input {...register('structured_description')} placeholder="Concise summary" />
          </div>
        </div>
      </Section>

      {/* C: Parties */}
      <Section label="C — Responsible Parties">
        <div className="grid grid-cols-2 gap-4">
          <div className="field">
            <Label className="field-label">External Responsible Party</Label>
            <Input {...register('responsible_party')} placeholder="Name as stated in contract" />
            <p className="field-hint">The party named in the contract clause</p>
          </div>
          <div className="field">
            <Label className="field-label">Internal Owner</Label>
            <Select defaultValue={initial?.owner_id ?? '__unassigned__'} onValueChange={v => setValue('owner_id', v)}>
              <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__unassigned__">— Unassigned —</SelectItem>
                {profiles.map(p => <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>)}
              </SelectContent>
            </Select>
            <p className="field-hint">The team member responsible internally</p>
          </div>
        </div>
      </Section>

      {/* D: Dates */}
      <Section label="D — Dates & Deadlines">
        <div className="grid grid-cols-2 gap-4">
          <div className="field">
            <Label className="field-label">Trigger Type</Label>
            <Select defaultValue={initial?.trigger_type ?? ''} onValueChange={v => setValue('trigger_type', v as TriggerType)}>
              <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="fixed_date">Fixed Date</SelectItem>
                <SelectItem value="relative_to_start">Relative to Start</SelectItem>
                <SelectItem value="relative_to_event">Relative to Event</SelectItem>
                <SelectItem value="manual">Manual</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="field">
            <Label className="field-label">Trigger Date</Label>
            <Input type="date" {...register('trigger_date')} />
          </div>
          <div className="field">
            <Label className="field-label">Duration (calendar days)</Label>
            <Input type="number" {...register('duration_days')} placeholder="e.g. 30" min={0} />
          </div>
          <div className="field">
            <Label className="field-label">Due Date</Label>
            <Input type="date" {...register('due_date')} />
          </div>
          <div className="field">
            <Label className="field-label">Reminder Date</Label>
            <Input type="date" {...register('reminder_date')} />
          </div>
        </div>
        {dateWarnings.map((w, i) => (
          <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs">
            <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />{w}
          </div>
        ))}
      </Section>

      {/* E: Priority & Status */}
      <Section label="E — Priority & Status">
        <div className="grid grid-cols-2 gap-4">
          <div className="field">
            <Label className="field-label">Priority</Label>
            <Select defaultValue={initial?.priority ?? 'medium'} onValueChange={v => setValue('priority', v as ObligationPriority)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="field">
            <Label className="field-label">Status</Label>
            <Select defaultValue={initial?.status ?? 'pending'} onValueChange={v => setValue('status', v as ObligationStatus)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Section>

      {/* F: Notes */}
      <Section label="F — Notes">
        <Textarea {...register('notes')} rows={2} placeholder="Internal notes visible only to your team" />
      </Section>

      <div className="flex justify-end gap-2 pt-2 border-t border-border/40">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>Cancel</Button>
        <Button type="submit" loading={loading}>{initial ? 'Save Changes' : 'Create Obligation'}</Button>
      </div>
    </form>
  )
}
