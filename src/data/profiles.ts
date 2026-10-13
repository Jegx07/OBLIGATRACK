import { supabase } from '@/lib/supabase'
import type { Profile, ProfileInsert, ProfileUpdate } from '@/types'

export async function fetchProfiles(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('full_name', { ascending: true })
  if (error) throw error
  return data || []
}

export async function fetchProfileById(id: string): Promise<Profile | null> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single()
  if (error) throw error
  return data
}

export async function createProfile(payload: ProfileInsert): Promise<Profile> {
  const { data, error } = await supabase.from('profiles').insert(payload).select().single()
  if (error) throw error
  return data
}

export async function updateProfile(id: string, payload: ProfileUpdate): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteProfile(id: string): Promise<void> {
  const { error } = await supabase.from('profiles').delete().eq('id', id)
  if (error) throw error
}
