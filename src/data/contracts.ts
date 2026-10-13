import { supabase } from '@/lib/supabase'
import type { Contract, ContractInsert, ContractUpdate, ContractFilters } from '@/types'

export async function fetchContracts(filters?: ContractFilters): Promise<Contract[]> {
  let query = supabase.from('contracts').select('*').order('created_at', { ascending: false })
  if (filters?.status) query = query.eq('status', filters.status)
  if (filters?.search) {
    query = query.or(`title.ilike.%${filters.search}%,contract_reference.ilike.%${filters.search}%,first_party.ilike.%${filters.search}%,second_party.ilike.%${filters.search}%`)
  }
  const { data, error } = await query
  if (error) throw error
  return data || []
}

export async function fetchContractById(id: string): Promise<Contract | null> {
  const { data, error } = await supabase.from('contracts').select('*').eq('id', id).single()
  if (error) throw error
  return data
}

export async function createContract(payload: ContractInsert): Promise<Contract> {
  const { data, error } = await supabase.from('contracts').insert(payload).select().single()
  if (error) throw error
  return data
}

export async function updateContract(id: string, payload: ContractUpdate): Promise<Contract> {
  const { data, error } = await supabase
    .from('contracts')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteContract(id: string): Promise<void> {
  // Check for obligations first
  const { count, error: checkError } = await supabase
    .from('obligations')
    .select('id', { count: 'exact', head: true })
    .eq('contract_id', id)
  if (checkError) throw checkError
  if ((count ?? 0) > 0) {
    throw new Error(`This contract has ${count} associated obligation(s). Remove or reassign them before deleting the contract.`)
  }
  const { error } = await supabase.from('contracts').delete().eq('id', id)
  if (error) throw error
}

export async function contractObligationCount(id: string): Promise<number> {
  const { count, error } = await supabase
    .from('obligations')
    .select('id', { count: 'exact', head: true })
    .eq('contract_id', id)
  if (error) throw error
  return count ?? 0
}
