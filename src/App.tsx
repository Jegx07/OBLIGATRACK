import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { SetupBanner } from '@/components/layout/SetupBanner'
import { isSupabaseConfigured } from '@/lib/supabase'
import DashboardPage from '@/pages/DashboardPage'
import ContractsPage from '@/pages/ContractsPage'
import ContractDetailPage from '@/pages/ContractDetailPage'
import ObligationsPage from '@/pages/ObligationsPage'
import ObligationDetailPage from '@/pages/ObligationDetailPage'
import TeamPage from '@/pages/TeamPage'
import ReportsPage from '@/pages/ReportsPage'
import SettingsPage from '@/pages/SettingsPage'

export default function App() {
  if (!isSupabaseConfigured) {
    return <SetupBanner />
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/contracts" element={<ContractsPage />} />
          <Route path="/contracts/:id" element={<ContractDetailPage />} />
          <Route path="/obligations" element={<ObligationsPage />} />
          <Route path="/obligations/:id" element={<ObligationDetailPage />} />
          <Route path="/team" element={<TeamPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
