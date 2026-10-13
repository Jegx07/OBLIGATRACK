import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, FileText, ClipboardList, Users,
  BarChart2, Settings, ShieldCheck, ChevronLeft, ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/',            label: 'Dashboard',   icon: LayoutDashboard, end: true },
  { to: '/contracts',   label: 'Contracts',   icon: FileText,        end: false },
  { to: '/obligations', label: 'Obligations', icon: ClipboardList,   end: false },
  { to: '/team',        label: 'Team',        icon: Users,           end: false },
  { to: '/reports',     label: 'Reports',     icon: BarChart2,       end: false },
  { to: '/settings',    label: 'Settings',    icon: Settings,        end: false },
]

const easeOut = [0.16, 1, 0.3, 1]

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <motion.aside
      animate={{ width: collapsed ? 64 : 224 }}
      transition={{ duration: 0.3, ease: easeOut }}
      className="relative shrink-0 border-r border-border/60 bg-card flex flex-col h-screen sticky top-0 overflow-hidden shadow-[1px_0_0_0_hsl(var(--border))]"
    >
      {/* Logo */}
      <div className={cn(
        'flex items-center border-b border-border/60 h-[60px] px-4 shrink-0',
        collapsed ? 'justify-center' : 'gap-2.5'
      )}>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary shadow-md">
          <ShieldCheck className="h-4.5 w-4.5 text-white" strokeWidth={2.5} />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <span className="font-bold text-sm tracking-tight text-foreground whitespace-nowrap">ObligaTrack</span>
              <span className="block text-[10px] text-muted-foreground leading-none mt-0.5 whitespace-nowrap">Contract Intelligence</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto overflow-x-hidden scrollbar-thin">
        {collapsed && <div className="h-2" />}
        {!collapsed && (
          <p className="section-label px-3 py-2 mb-1">Navigation</p>
        )}
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'nav-item group relative',
                isActive && 'nav-item-active',
                collapsed && 'justify-center px-0'
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute inset-0 rounded-lg bg-primary/10"
                    transition={{ duration: 0.25, ease: easeOut }}
                  />
                )}
                <Icon
                  className={cn(
                    'h-4 w-4 shrink-0 relative z-10 transition-colors',
                    isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                  )}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className={cn(
                        'relative z-10 whitespace-nowrap text-sm',
                        isActive ? 'text-primary font-semibold' : 'text-muted-foreground group-hover:text-foreground'
                      )}
                    >
                      {label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Collapse button */}
      <div className="px-2 py-3 border-t border-border/60">
        <button
          onClick={() => setCollapsed(v => !v)}
          className={cn(
            'nav-item w-full text-muted-foreground',
            collapsed && 'justify-center px-0'
          )}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed
            ? <ChevronRight className="h-4 w-4 shrink-0" />
            : <><ChevronLeft className="h-4 w-4 shrink-0" /><span className="text-sm">Collapse</span></>
          }
        </button>
      </div>

      {/* Footer legal notice */}
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="px-4 py-3 border-t border-border/60 bg-muted/30"
          >
            <p className="text-[10px] text-muted-foreground/70 leading-snug">
              ObligaTrack is an administrative tool and does not constitute legal advice.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.aside>
  )
}
