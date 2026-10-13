import { supabase } from '@/lib/supabase'
import type { Obligation, ObligationInsert, ObligationUpdate, ObligationWithDetails, ObligationFilters } from '@/types'

export async function fetchObligations(filters?: ObligationFilters): Promise<ObligationWithDetails[]> {
  let query = supabase
    .from('obligations')
    .select('*, contract:contracts(*), owner:profiles!obligations_owner_id_fkey(*)')
    .order('due_date', { ascending: true, nullsFirst: false })

  if (filters?.contract_id) query = query.eq('contract_id', filters.contract_id)
  if (filters?.status) query = query.eq('status', filters.status)
  if (filters?.priority) query = query.eq('priority', filters.priority)
  if (filters?.owner_id === 'unassigned') query = query.is('owner_id', null)
  else if (filters?.owner_id) query = query.eq('owner_id', filters.owner_id)
  if (filters?.search) query = query.ilike('title', `%${filters.search}%`)

  const { data, error } = await query
  if (error) throw error
  return (data as unknown as ObligationWithDetails[]) || []
}

export async function fetchObligationById(id: string): Promise<ObligationWithDetails | null> {
  const { data, error } = await supabase
    .from('obligations')
    .select('*, contract:contracts(*), owner:profiles!obligations_owner_id_fkey(*)')
    .eq('id', id)
    .single()
  if (error) throw error
  return data as unknown as ObligationWithDetails
}

export async function createObligation(payload: ObligationInsert): Promise<Obligation> {
  const { data, error } = await supabase.from('obligations').insert(payload).select().single()
  if (error) throw error
  return data
}

export async function updateObligation(id: string, payload: ObligationUpdate): Promise<Obligation> {
  const { data, error } = await supabase
    .from('obligations')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteObligation(id: string): Promise<void> {
  const { error } = await supabase.from('obligations').delete().eq('id', id)
  if (error) throw error
}
