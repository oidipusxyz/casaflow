import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/shared/EmptyState'
import { formatRupiah, formatDate } from '@/lib/utils'
import { MapPin, Plus, FileText } from 'lucide-react'

const DOC_TYPES = ['AJB', 'SHM', 'IMB', 'PBB'] as const

const statusColor = {
  belum: 'secondary',
  proses: 'outline',
  selesai: 'default',
} as const

export default async function TanahPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('workspace_id')
    .eq('id', user!.id)
    .single()

  const { data: lands } = await supabase
    .from('lands')
    .select('*, land_documents(*)')
    .eq('workspace_id', profile!.workspace_id)
    .order('created_at', { ascending: false })

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Tracker Tanah</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Pantau status dokumen tanah yang sudah dimiliki
          </p>
        </div>
        <Button render={<Link href="/phase1/tanah/tambah" />}>
          <Plus className="h-4 w-4 mr-1.5" />
          Tambah Tanah
        </Button>
      </div>

      {!lands?.length ? (
        <EmptyState
          icon={MapPin}
          title="Belum ada tanah"
          description="Tambahkan data tanah yang sudah kamu miliki atau sedang dalam proses pembelian."
          action={
            <Button render={<Link href="/phase1/tanah/tambah" />}>
              Tambah Tanah Pertama
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          {lands.map((land) => {
            const docs = land.land_documents ?? []
            return (
              <Link key={land.id} href={`/phase1/tanah/${land.id}`}>
                <Card className="hover:border-foreground/30 transition-colors cursor-pointer">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <CardTitle className="text-base">{land.location}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {land.area_m2} m² · Dibeli {formatDate(land.purchase_date)}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-semibold text-sm">{formatRupiah(land.purchase_price)}</p>
                        {land.current_value && (
                          <p className="text-xs text-muted-foreground">
                            Estimasi: {formatRupiah(land.current_value)}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 flex-wrap">
                      <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      {DOC_TYPES.map((type) => {
                        const doc = docs.find((d: { type: string; status: string }) => d.type === type)
                        const status = doc?.status ?? 'belum'
                        return (
                          <Badge key={type} variant={statusColor[status as keyof typeof statusColor]}>
                            {type} {status === 'selesai' ? '✓' : status === 'proses' ? '⋯' : ''}
                          </Badge>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
