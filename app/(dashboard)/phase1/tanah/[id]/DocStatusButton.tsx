'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ChevronDown } from 'lucide-react'

const STATUS_OPTIONS = [
  { value: 'belum', label: 'Belum' },
  { value: 'proses', label: 'Proses' },
  { value: 'selesai', label: 'Selesai' },
] as const

type Status = 'belum' | 'proses' | 'selesai'

export function DocStatusButton({ docId, currentStatus }: { docId: string; currentStatus: Status }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function updateStatus(newStatus: Status) {
    if (newStatus === currentStatus) return
    setLoading(true)
    const supabase = createClient()
    await supabase
      .from('land_documents')
      .update({
        status: newStatus,
        completed_date: newStatus === 'selesai' ? new Date().toISOString().split('T')[0] : null,
      })
      .eq('id', docId)
    router.refresh()
    setLoading(false)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <button
          disabled={loading}
          className="inline-flex items-center h-7 px-2 text-xs rounded-md hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
        >
          Ubah <ChevronDown className="h-3 w-3 ml-1" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {STATUS_OPTIONS.map((opt) => (
          <DropdownMenuItem
            key={opt.value}
            onClick={() => updateStatus(opt.value)}
            className={currentStatus === opt.value ? 'font-medium' : ''}
          >
            {opt.label} {currentStatus === opt.value ? '✓' : ''}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
