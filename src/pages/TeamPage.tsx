import { useEffect, useState } from 'react'
import { Plus, Edit2, Trash2, Users } from 'lucide-react'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Card } from '@/components/ui/card'
import { PageHeader } from '@/components/shared/PageHeader'
import { TableSkeleton, ErrorMessage, EmptyState } from '@/components/shared/States'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { AnimateIn } from '@/components/motion/AnimateIn'
import { fetchProfiles, createProfile, updateProfile, deleteProfile } from '@/data/profiles'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/useToast'
import type { Profile, ProfileInsert, UserRole } from '@/types'

interface FormValues { full_name: string; email: string; role: UserRole }

const roleStyles: Record<UserRole, string> = {
  admin:   'bg-purple-50 text-purple-700 border-purple-200',
  manager: 'bg-blue-50 text-blue-700 border-blue-200',
  member:  'bg-slate-50 text-slate-600 border-slate-200',
}

const easeOut = [0.16, 1, 0.3, 1]

function Avatar({ name }: { name: string }) {
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  const colors = ['bg-blue-100 text-blue-700', 'bg-purple-100 text-purple-700', 'bg-emerald-100 text-emerald-700', 'bg-orange-100 text-orange-700']
  const color = colors[name.charCodeAt(0) % colors.length]
  return (
    <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${color}`}>
      {initials}
    </div>
  )
}

export default function TeamPage() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [obligationCounts, setObligationCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editTarget, setEditTarget] = useState<Profile | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<FormValues>()

  const load = async () => {
    setLoading(true); setError(null)
    try {
      const p = await fetchProfiles()
      setProfiles(p)
      const { data } = await supabase.from('obligations').select('owner_id').in('status', ['pending', 'in_progress']).not('owner_id', 'is', null)
      const counts: Record<string, number> = {}
      ;(data ?? []).forEach((r: any) => { counts[r.owner_id] = (counts[r.owner_id] ?? 0) + 1 })
      setObligationCounts(counts)
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const openCreate = () => { setEditTarget(null); reset({ full_name: '', email: '', role: 'member' }); setFormOpen(true) }
  const openEdit = (p: Profile) => { setEditTarget(p); reset({ full_name: p.full_name, email: p.email, role: p.role }); setFormOpen(true) }

  const handleSave = async (values: FormValues) => {
    setSaving(true)
    try {
      if (editTarget) { await updateProfile(editTarget.id, values); toast({ title: 'Profile updated' }) }
      else { await createProfile(values as ProfileInsert); toast({ title: 'Team member added' }) }
      setFormOpen(false); load()
    } catch (e: any) { toast({ variant: 'destructive', title: 'Error', description: e.message }) }
    finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    try { await deleteProfile(id); toast({ title: 'Profile deleted' }); load() }
    catch (e: any) { toast({ variant: 'destructive', title: 'Error', description: e.message }) }
  }

  return (
    <div className="space-y-5">
      <AnimateIn direction="down" duration={0.25}>
        <PageHeader
          title="Team"
          description="Manage internal team members and obligation assignments."
          actions={<Button onClick={openCreate}><Plus className="h-4 w-4" /> Add Member</Button>}
        />
      </AnimateIn>

      {loading && <TableSkeleton rows={4} cols={5} />}
      {error && <ErrorMessage message={error} onRetry={load} />}
      {!loading && !error && profiles.length === 0 && (
        <EmptyState icon={Users} title="No team members" description="Add team members to enable obligation assignment." action={<Button onClick={openCreate}><Plus className="h-4 w-4" /> Add Member</Button>} />
      )}

      {!loading && !error && profiles.length > 0 && (
        <AnimateIn direction="up" delay={0.08}>
          <Card className="overflow-hidden">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th className="text-center">Active Obligations</th>
                  <th className="w-20" />
                </tr>
              </thead>
              <tbody>
                {profiles.map((p, i) => (
                  <motion.tr
                    key={p.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04, duration: 0.28, ease: easeOut }}
                    className="border-b border-border/50 hover:bg-muted/20 transition-colors"
                  >
                    <td>
                      <div className="flex items-center gap-3">
                        <Avatar name={p.full_name} />
                        <span className="font-medium text-sm">{p.full_name}</span>
                      </div>
                    </td>
                    <td className="text-sm text-muted-foreground">{p.email}</td>
                    <td>
                      <span className={`status-pill capitalize ${roleStyles[p.role]}`}>{p.role}</span>
                    </td>
                    <td className="text-center">
                      <span className={`text-sm font-semibold ${(obligationCounts[p.id] ?? 0) > 0 ? 'text-foreground' : 'text-muted-foreground/40'}`}>
                        {obligationCounts[p.id] ?? 0}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1 justify-end">
                        <Button variant="ghost" size="icon-sm" onClick={() => openEdit(p)}>
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <ConfirmDialog
                          trigger={<Button variant="ghost" size="icon-sm" className="text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>}
                          title="Remove team member?"
                          description="Obligations assigned to this person will become unassigned."
                          confirmLabel="Remove" destructive onConfirm={() => handleDelete(p.id)}
                        />
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </Card>
        </AnimateIn>
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editTarget ? 'Edit Team Member' : 'Add Team Member'}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit(handleSave)} className="space-y-4 mt-2">
            <div className="field">
              <Label className="field-label">Full Name *</Label>
              <Input {...register('full_name', { required: 'Required' })} placeholder="Jane Smith" />
              {errors.full_name && <p className="field-error">{errors.full_name.message}</p>}
            </div>
            <div className="field">
              <Label className="field-label">Email *</Label>
              <Input type="email" {...register('email', { required: 'Required' })} placeholder="jane@example.com" />
              {errors.email && <p className="field-error">{errors.email.message}</p>}
            </div>
            <div className="field">
              <Label className="field-label">Role</Label>
              <Select defaultValue={editTarget?.role ?? 'member'} onValueChange={v => setValue('role', v as UserRole)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="member">Member</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-border/40">
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)} disabled={saving}>Cancel</Button>
              <Button type="submit" loading={saving}>{editTarget ? 'Save Changes' : 'Add Member'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
