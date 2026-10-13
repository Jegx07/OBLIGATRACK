import { Outlet, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Sidebar } from './Sidebar'
import { Toaster } from '@/components/ui/toaster'
import { Bell, HelpCircle } from 'lucide-react'

const routeLabels: Record<string, string> = {
  '/':            'Dashboard',
  '/contracts':   'Contracts',
  '/obligations': 'Obligations',
  '/team':        'Team',
  '/reports':     'Reports',
  '/settings':    'Settings',
}

function TopBar() {
  const { pathname } = useLocation()
  const base = '/' + (pathname.split('/')[1] ?? '')
  const label = routeLabels[base] ?? 'ObligaTrack'
  const isDetail = pathname.split('/').length > 2

  return (
    <header className="h-[60px] shrink-0 flex items-center justify-between px-6 border-b border-border/60 bg-card/80 glass sticky top-0 z-30">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="font-medium text-foreground">{label}</span>
        {isDetail && (
          <>
            <span className="text-border">/</span>
            <span>Detail</span>
          </>
        )}
      </div>
      <div className="flex items-center gap-1">
        <button className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors" aria-label="Help">
          <HelpCircle className="h-4 w-4" />
        </button>
        <button className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors" aria-label="Notifications">
          <Bell className="h-4 w-4" />
        </button>
        <div className="ml-2 h-7 w-7 rounded-full bg-primary/15 flex items-center justify-center text-xs font-semibold text-primary border border-primary/20">
          OT
        </div>
      </div>
    </header>
  )
}

export function Layout() {
  const { pathname } = useLocation()

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />
        <main className="flex-1 overflow-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="p-6 max-w-[1400px] mx-auto"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      <Toaster />
    </div>
  )
}
