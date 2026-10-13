import { supabase } from '@/lib/supabase'
import type { ProfileInsert, ContractInsert, ObligationInsert } from '@/types'

// Reference date: 13 October 2026
const REF = '2026-10-13'

function dateOffset(days: number): string {
  const d = new Date(REF)
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

export async function seedDemoData(): Promise<string> {
  const log: string[] = []

  // --- PROFILES ---
  const profileSeeds: ProfileInsert[] = [
    { full_name: 'Alice Mensah', email: 'alice.mensah@demo.obligatrack', role: 'admin' },
    { full_name: 'Ben Okafor', email: 'ben.okafor@demo.obligatrack', role: 'manager' },
    { full_name: 'Clara Nwosu', email: 'clara.nwosu@demo.obligatrack', role: 'member' },
    { full_name: 'David Adeyemi', email: 'david.adeyemi@demo.obligatrack', role: 'member' },
  ]

  const profiles: Record<string, string> = {}
  for (const p of profileSeeds) {
    const { data: existing } = await supabase.from('profiles').select('id').eq('email', p.email).maybeSingle()
    if (existing) { profiles[p.full_name] = (existing as { id: string }).id; continue }
    const { data, error } = await supabase.from('profiles').insert(p).select('id').single()
    if (error) throw new Error(`Profile seed failed: ${error.message}`)
    profiles[p.full_name] = (data as { id: string }).id
    log.push(`Created profile: ${p.full_name}`)
  }

  // --- CONTRACTS ---
  type ContractSeed = ContractInsert & { _key: string }
  const contractSeeds: ContractSeed[] = [
    {
      _key: 'DEMO-CNT-001',
      contract_reference: 'DEMO-CNT-001',
      title: '[DEMO] Software Licensing Agreement',
      first_party: 'Acme Corp',
      second_party: 'TechVendor Ltd',
      start_date: '2025-01-01',
      end_date: '2027-01-01',
      renewal_date: dateOffset(20),
      status: 'active',
      description: 'Enterprise software licensing for productivity suite.',
    },
    {
      _key: 'DEMO-CNT-002',
      contract_reference: 'DEMO-CNT-002',
      title: '[DEMO] Facilities Management Contract',
      first_party: 'Acme Corp',
      second_party: 'CleanSpace FM',
      start_date: '2024-06-01',
      end_date: '2026-05-31',
      renewal_date: null,
      status: 'expired',
      description: 'Monthly facilities and cleaning services.',
    },
    {
      _key: 'DEMO-CNT-003',
      contract_reference: 'DEMO-CNT-003',
      title: '[DEMO] Professional Services Agreement',
      first_party: 'Acme Corp',
      second_party: 'Consulting Partners Ltd',
      start_date: '2026-03-01',
      end_date: '2027-03-01',
      renewal_date: dateOffset(60),
      status: 'active',
      description: 'Strategic advisory and project delivery services.',
    },
    {
      _key: 'DEMO-CNT-004',
      contract_reference: 'DEMO-CNT-004',
      title: '[DEMO] Cloud Hosting Services Agreement',
      first_party: 'Acme Corp',
      second_party: 'CloudBase Inc',
      start_date: '2025-07-01',
      end_date: '2027-06-30',
      renewal_date: dateOffset(90),
      status: 'active',
      description: 'Infrastructure and hosting services.',
    },
    {
      _key: 'DEMO-CNT-005',
      contract_reference: 'DEMO-CNT-005',
      title: '[DEMO] Data Processing Agreement',
      first_party: 'Acme Corp',
      second_party: 'DataSafe Ltd',
      start_date: '2026-01-01',
      end_date: '2028-01-01',
      renewal_date: null,
      status: 'draft',
      description: 'GDPR-compliant data processing addendum.',
    },
  ]

  const contractIds: Record<string, string> = {}
  for (const c of contractSeeds) {
    const { data: existing } = await supabase.from('contracts').select('id').eq('contract_reference', c.contract_reference).maybeSingle()
    if (existing) { contractIds[c._key] = (existing as { id: string }).id; continue }
    const { _key, ...insert } = c
    const { data, error } = await supabase.from('contracts').insert(insert).select('id').single()
    if (error) throw new Error(`Contract seed failed: ${error.message}`)
    contractIds[_key] = (data as { id: string }).id
    log.push(`Created contract: ${c.title}`)
  }

  // --- OBLIGATIONS ---
  type ObligationSeed = ObligationInsert & { _key: string; contract_ref: string; owner_name: string | null }
  const obligationSeeds: ObligationSeed[] = [
    {
      _key: 'DEMO-OBL-001', contract_ref: 'DEMO-CNT-001', owner_name: 'Ben Okafor',
      title: '[DEMO] Quarterly Licence Renewal Payment',
      original_clause: 'The Licensee shall remit payment within 30 calendar days from the invoice date.',
      structured_description: 'Quarterly licence fee payment due within 30 days of invoice.',
      obligation_type: 'payment', responsible_party: 'Finance Department',
      trigger_type: 'fixed_date', trigger_date: dateOffset(-35), duration_days: 30,
      due_date: dateOffset(-5), priority: 'critical', status: 'pending',
      notes: '[DEMO] Overdue for demonstration purposes.',
      contract_id: '', owner_id: null,
    },
    {
      _key: 'DEMO-OBL-002', contract_ref: 'DEMO-CNT-001', owner_name: 'Clara Nwosu',
      title: '[DEMO] Software Compliance Report Submission',
      original_clause: 'The Licensee shall submit a compliance report no later than 15 November 2026.',
      structured_description: 'Annual compliance report confirming usage within licensed limits.',
      obligation_type: 'reporting', responsible_party: 'IT Department',
      trigger_type: 'fixed_date', trigger_date: null, duration_days: null,
      due_date: dateOffset(33), priority: 'high', status: 'in_progress',
      contract_id: '', owner_id: null,
    },
    {
      _key: 'DEMO-OBL-003', contract_ref: 'DEMO-CNT-003', owner_name: null,
      title: '[DEMO] Project Delivery Milestone Review',
      original_clause: 'Within 60 calendar days from the effective date, the Consultant shall deliver the Phase 1 assessment.',
      structured_description: 'Phase 1 assessment delivery by Consulting Partners.',
      obligation_type: 'delivery', responsible_party: 'Consulting Partners Ltd',
      trigger_type: 'relative_to_start', trigger_date: '2026-03-01', duration_days: 60,
      due_date: dateOffset(3), priority: 'high', status: 'pending',
      contract_id: '', owner_id: null,
    },
    {
      _key: 'DEMO-OBL-004', contract_ref: 'DEMO-CNT-004', owner_name: 'Alice Mensah',
      title: '[DEMO] Service Level Review Meeting',
      original_clause: 'The parties shall convene a service level review meeting on or before the agreed review date.',
      structured_description: 'Bi-annual SLA performance review.',
      obligation_type: 'service', responsible_party: 'CloudBase Inc',
      trigger_type: null, trigger_date: null, duration_days: null,
      due_date: null, priority: 'medium', status: 'pending',
      notes: '[DEMO] Due date not yet confirmed.',
      contract_id: '', owner_id: null,
    },
    {
      _key: 'DEMO-OBL-005', contract_ref: 'DEMO-CNT-001', owner_name: 'David Adeyemi',
      title: '[DEMO] Initial Security Audit',
      original_clause: 'The Licensee shall complete an initial security audit within 90 days of contract execution.',
      structured_description: 'Security audit of licensee systems.',
      obligation_type: 'compliance', responsible_party: 'IT Department',
      trigger_type: 'relative_to_start', trigger_date: '2025-01-01', duration_days: 90,
      due_date: '2025-04-01', priority: 'medium', status: 'completed',
      contract_id: '', owner_id: null,
    },
    {
      _key: 'DEMO-OBL-006', contract_ref: 'DEMO-CNT-003', owner_name: 'Ben Okafor',
      title: '[DEMO] Monthly Progress Report',
      original_clause: 'The Consultant shall submit a monthly progress report by the 5th of each month.',
      structured_description: 'Monthly written status report on project activities.',
      obligation_type: 'reporting', responsible_party: 'Consulting Partners Ltd',
      trigger_type: 'fixed_date', trigger_date: null, duration_days: null,
      due_date: dateOffset(2), priority: 'medium', status: 'pending',
      contract_id: '', owner_id: null,
    },
    {
      _key: 'DEMO-OBL-007', contract_ref: 'DEMO-CNT-002', owner_name: 'Alice Mensah',
      title: '[DEMO] Contract Renewal Decision',
      original_clause: 'The renewal date of this agreement is 31 May 2026.',
      structured_description: 'Decision on contract renewal required.',
      obligation_type: 'renewal', responsible_party: 'Procurement Team',
      trigger_type: 'fixed_date', trigger_date: null, duration_days: null,
      due_date: '2026-05-31', priority: 'high', status: 'pending',
      contract_id: '', owner_id: null,
    },
    {
      _key: 'DEMO-OBL-008', contract_ref: 'DEMO-CNT-004', owner_name: 'David Adeyemi',
      title: '[DEMO] Data Backup Verification',
      original_clause: 'CloudBase Inc shall perform and confirm data backup verification within 7 calendar days of each quarterly period.',
      structured_description: 'Quarterly data backup verification and confirmation report.',
      obligation_type: 'compliance', responsible_party: 'CloudBase Inc',
      trigger_type: 'fixed_date', trigger_date: dateOffset(-10), duration_days: 7,
      due_date: dateOffset(-3), priority: 'critical', status: 'in_progress',
      contract_id: '', owner_id: null,
    },
    {
      _key: 'DEMO-OBL-009', contract_ref: 'DEMO-CNT-005', owner_name: 'Clara Nwosu',
      title: '[DEMO] Data Processing Impact Assessment',
      original_clause: 'Within 30 calendar days from 2026-01-01, the Processor shall submit a Data Processing Impact Assessment.',
      structured_description: 'DPIA submitted by DataSafe Ltd confirming GDPR compliance.',
      obligation_type: 'compliance', responsible_party: 'DataSafe Ltd',
      trigger_type: 'fixed_date', trigger_date: '2026-01-01', duration_days: 30,
      due_date: '2026-01-31', priority: 'high', status: 'completed',
      notes: '[DEMO] Trigger date confirmed. Due = 2026-01-01 + 30 days.',
      contract_id: '', owner_id: null,
    },
    {
      _key: 'DEMO-OBL-010', contract_ref: 'DEMO-CNT-003', owner_name: null,
      title: '[DEMO] Final Deliverable Submission',
      original_clause: 'The Consultant shall submit all final deliverables on or before 28 February 2027.',
      structured_description: 'All contracted deliverables submitted for client review.',
      obligation_type: 'delivery', responsible_party: 'Consulting Partners Ltd',
      trigger_type: 'fixed_date', trigger_date: null, duration_days: null,
      due_date: dateOffset(138), priority: 'medium', status: 'pending',
      contract_id: '', owner_id: null,
    },
  ]

  for (const o of obligationSeeds) {
    const { data: existing } = await supabase.from('obligations').select('id').eq('title', o.title).maybeSingle()
    if (existing) continue

    const contractId = contractIds[o.contract_ref]
    if (!contractId) continue
    const ownerId = o.owner_name ? (profiles[o.owner_name] ?? null) : null

    const { _key, contract_ref, owner_name, ...rest } = o
    const insert: ObligationInsert = { ...rest, contract_id: contractId, owner_id: ownerId }

    const { error } = await supabase.from('obligations').insert(insert)
    if (error) throw new Error(`Obligation seed failed [${o.title}]: ${error.message}`)
    log.push(`Created obligation: ${o.title}`)
  }

  // Activity log entry
  await supabase.from('activity_log').insert({
    entity_type: 'system',
    entity_id: 'seed',
    action: 'seed',
    description: 'Demonstration data seeded into ObligaTrack.',
  })

  if (log.length === 0) return 'All demonstration records already exist. No new records created.'
  return `Created ${log.length} records.`
}
