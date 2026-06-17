import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatRupiah, formatDate } from '@/lib/utils'
import { ArrowLeft, Pencil } from 'lucide-react'
import { DocStatusButton } from './DocStatusButton'

const DOC_TYPES = [
  { type: 'AJB', label: 'Akta Jual Beli', desc: 'Dokumen awal saat transaksi' },
  { type: 'SHM', label: 'Sertifikat Hak Milik', desc: 'Balik nama ke nama pembeli' },
  { type: 'IMB', label: 'Izin Mendirikan Bangunan', desc: 'Izin bangun rumah nanti' },
  { type: 'PBB', label: 'Pajak Bumi & Bangunan', desc: 'Pajak tahunan' },
] as const

const MONTHS = ['', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

const statusBadge = {
  belum: { label: 'Belum', variant: 'secondary' as const },
  proses: { label: 'Proses', variant: 'outline' as const },
  selesai: { label: 'Selesai ✓', variant: 'default' as const },
}

export default async function TanahDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: land } = await supabase
    .from('lands')
    .select('*, land_documents(*)')
    .eq('id', id)
    .single()

  if (!land) notFound()

  const docs = land.land_documents ?? []
  const appreciation = land.current_value
    ? ((land.current_value - land.purchase_price) / land.purchase_price * 100).toFixed(1)
    : null

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" render={<Link href="/phase1/tanah" />}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold">{land.location}</h1>
            <p className="text-sm text-muted-foreground">Dibeli {formatDate(land.purchase_date)}</p>
          </div>
        </div>
        <Button variant="outline" size="sm" render={<Link href={`/phase1/tanah/${id}/edit`} />}>
          <Pencil className="h-3.5 w-3.5 mr-1.5" />Edit
        </Button>
      </div>

      {/* Info Card */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Luas', value: `${land.area_m2} m²` },
          { label: 'Harga Beli', value: formatRupiah(land.purchase_price) },
          { label: 'Nilai Sekarang', value: land.current_value ? formatRupiah(land.current_value) : '—' },
          { label: 'Apresiasi', value: appreciation ? `+${appreciation}%` : '—' },
        ].map((item) => (
          <Card key={item.label}>
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-muted-foreground">{item.label}</p>
              <p className="font-semibold text-sm mt-0.5">{item.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Dokumen */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Status Dokumen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {DOC_TYPES.map(({ type, label, desc }) => {
            const doc = docs.find((d: { type: string; status: string; id: string }) => d.type === type)
            const status = (doc?.status ?? 'belum') as 'belum' | 'proses' | 'selesai'
            const badge = statusBadge[status]
            return (
              <div key={type} className="flex items-center justify-between gap-4 py-2 border-b last:border-0">
                <div>
                  <p className="text-sm font-medium">{type} — {label}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant={badge.variant}>{badge.label}</Badge>
                  {doc && <DocStatusButton docId={doc.id} currentStatus={status} />}
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Info tambahan */}
      {(land.seller_name || land.certificate_number || land.pbb_due_month || land.notes) && (
        <Card>
          <CardHeader><CardTitle className="text-base">Informasi Tambahan</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {land.seller_name && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Nama Penjual</span>
                <span>{land.seller_name}</span>
              </div>
            )}
            {land.certificate_number && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">No. Sertifikat</span>
                <span>{land.certificate_number}</span>
              </div>
            )}
            {land.pbb_due_month && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Jatuh Tempo PBB</span>
                <span>{MONTHS[land.pbb_due_month]}</span>
              </div>
            )}
            {land.notes && (
              <div className="pt-1">
                <p className="text-muted-foreground mb-1">Catatan</p>
                <p className="whitespace-pre-wrap">{land.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
