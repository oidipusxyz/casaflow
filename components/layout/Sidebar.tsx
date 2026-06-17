'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import {
  Home, MapPin, CheckSquare, Wallet, PiggyBank,
  Settings, LogOut, ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

type NavLink = { href: string; label: string; icon: React.ElementType }
type NavSection = { section: string; items: NavLink[] }
type NavItem = NavLink | NavSection

const nav: NavItem[] = [
  { href: '/', label: 'Beranda', icon: Home },
  {
    section: 'Phase 1 — Persiapan Nikah',
    items: [
      { href: '/phase1/tanah', label: 'Tracker Tanah', icon: MapPin },
      { href: '/phase1/checklist', label: 'Checklist Nikah', icon: CheckSquare },
      { href: '/phase1/anggaran', label: 'Anggaran Nikah', icon: Wallet },
      { href: '/phase1/tabungan', label: 'Tabungan Nikah', icon: PiggyBank },
    ],
  },
]

interface SidebarProps {
  userName: string
  userRole: string
}

export function Sidebar({ userName, userRole }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="w-60 shrink-0 border-r bg-background flex flex-col h-screen sticky top-0">
      <div className="px-4 py-5 border-b">
        <p className="font-bold text-base">CasaFlow</p>
        <p className="text-xs text-muted-foreground mt-0.5">Rencanakan hidup berdua</p>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {nav.map((item, i) => {
          if ('href' in item) {
            const Icon = item.icon
            const active = pathname === item.href
            return (
              <Link
                key={i}
                href={item.href}
                className={cn(
                  'flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  active
                    ? 'bg-foreground text-background'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            )
          }

          return (
            <div key={i}>
              <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                {item.section}
              </p>
              <div className="space-y-1">
                {item.items.map((sub) => {
                  const Icon = sub.icon
                  const active = pathname.startsWith(sub.href)
                  return (
                    <Link
                      key={sub.href}
                      href={sub.href}
                      className={cn(
                        'flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors',
                        active
                          ? 'bg-foreground text-background font-medium'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {sub.label}
                    </Link>
                  )
                })}
              </div>
            </div>
          )
        })}
      </nav>

      <div className="px-3 py-4 border-t space-y-1">
        <Link
          href="/settings/profile"
          className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <Settings className="h-4 w-4" />
          Pengaturan
        </Link>
        <div className="flex items-center justify-between px-3 py-2">
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{userName}</p>
            <p className="text-xs text-muted-foreground capitalize">{userRole}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={signOut} className="h-8 w-8 shrink-0 text-muted-foreground">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </aside>
  )
}
