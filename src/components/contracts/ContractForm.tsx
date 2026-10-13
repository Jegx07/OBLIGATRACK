import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { AlertCircle, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { validateContractDates } from '@/lib/dateValidation'
import type { Contract, ContractInsert, ContractStatus } from '@/types'

interface ContractFormProps {
  initial?: Contract
  onSubmit: (data: ContractInsert) => Promise<void>
  onCancel: () => void
  loading?: boolean
}

interface FormValues {
  contract_reference: string; title: string
  first_party: string; second_party: string
  start_date: string; end_date: string; renewal_date: string
  status: ContractStatus; description: string; notes: string
}

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <p className="section-label">{label}</p>
      {children}
    </div>
  )
}

export function ContractForm({ initial, onSubmit, onCancel, loading }: ContractFormProps) {
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormValues>({
    defaultValues: {
      contract_reference: initial?.contract_reference ?? '',
      title: initial?.title ?? '',
      first_party: initial?.first_party ?? '',
      second_party: initial?.second_party ?? '',
      start_date: initial?.start_date ?? '',
      end_date: initial?.end_date ?? '',
      renewal_date: initial?.renewal_date ?? '',
      status: initial?.status ?? 'draft',
      description: initial?.description ?? '',
      notes: initial?.notes ?? '',
    },
  })

  const [dateWarnings, setDateWarnings] = useState<string[]>([])
  const [dateErrors, setDateErrors] = useState<string[]>([])
  const startDate = watch('start_date')
  const endDate = watch('end_date')
  const renewalDate = watch('renewal_date')

  useEffect(() => {
    const warns = validateContractDates(startDate, endDate, renewalDate)
    setDateErrors(warns.filter(w => w.severity === 'error').map(w => w.message))
    setDateWarnings(warns.filter(w => w.severity === 'warning').map(w => w.message))
  }, [startDate, endDate, renewalDate])

  const handleFormSubmit = async (values: FormValues) => {
    if (dateErrors.length > 0) return
    await onSubmit({
      contract_reference: values.contract_reference,
      title: values.title,
      first_party: values.first_party,
      second_party: values.second_party,
      start_date: values.start_date,
      end_date: values.end_date,
      renewal_date: values.renewal_date || null,
      status: values.status,
      description: values.description || null,
      notes: values.notes || null,
    })
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <FieldGroup label="Identification">
        <div className="grid grid-cols-2 gap-4">
          <div className="field">
            <Label className="field-label">Contract Reference *</Label>
            <Input {...register('contract_reference', { required: 'Required' })} placeholder="CNT-2026-001" />
            {errors.contract_reference && <p className="field-error">{errors.contract_reference.message}</p>}
          </div>
          <div className="field">
            <Label className="field-label">Status</Label>
            <Select defaultValue={initial?.status ?? 'draft'} onValueChange={v => setValue('status', v as ContractStatus)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="terminated">Terminated</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="field">
          <Label className="field-label">Contract Title *</Label>
          <Input {...register('title', { required: 'Required' })} placeholder="Software Licensing Agreement" />
          {errors.title && <p className="field-error">{errors.title.message}</p>}
        </div>
      </FieldGroup>

      <FieldGroup label="Parties">
        <div className="grid grid-cols-2 gap-4">
          <div className="field">
            <Label className="field-label">First Party *</Label>
            <Input {...register('first_party', { required: 'Required' })} placeholder="Your organisation" />
            {errors.first_party && <p className="field-error">{errors.first_party.message}</p>}
          </div>
          <div className="field">
            <Label className="field-label">Second Party *</Label>
            <Input {...register('second_party', { required: 'Required' })} placeholder="Counterparty name" />
            {errors.second_party && <p className="field-error">{errors.second_party.message}</p>}
          </div>
        </div>
      </FieldGroup>

      <FieldGroup label="Dates">
        <div className="grid grid-cols-3 gap-4">
          <div className="field">
            <Label className="field-label">Start Date *</Label>
            <Input type="date" {...register('start_date', { required: 'Required' })} />
            {errors.start_date && <p className="field-error">{errors.start_date.message}</p>}
          </div>
          <div className="field">
            <Label className="field-label">End Date *</Label>
            <Input type="date" {...register('end_date', { required: 'Required' })} />
            {errors.end_date && <p className="field-error">{errors.end_date.message}</p>}
          </div>
          <div className="field">
            <Label className="field-label">Renewal Date</Label>
            <Input type="date" {...register('renewal_date')} />
            <p className="field-hint">Optional</p>
          </div>
        </div>
        {dateErrors.map((e, i) => (
          <div key={i} className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />{e}
          </div>
        ))}
        {dateWarnings.map((w, i) => (
          <div key={i} className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />{w}
          </div>
        ))}
      </FieldGroup>

      <FieldGroup label="Details">
        <div className="field">
          <Label className="field-label">Description</Label>
          <Textarea {...register('description')} rows={3} placeholder="Brief description of this contract and its purpose" />
        </div>
        <div className="field">
          <Label className="field-label">Internal Notes</Label>
          <Textarea {...register('notes')} rows={2} placeholder="Internal notes visible only to your team" />
        </div>
      </FieldGroup>

      <div className="flex justify-end gap-2 pt-2 border-t border-border/40">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>Cancel</Button>
        <Button type="submit" loading={loading} disabled={dateErrors.length > 0}>
          {initial ? 'Save Changes' : 'Create Contract'}
        </Button>
      </div>
    </form>
  )
}
