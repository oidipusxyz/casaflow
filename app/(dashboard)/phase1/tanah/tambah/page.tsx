'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]

const schema = z.object({
  location: z.string().min(3, 'Lokasi minimal 3 karakter'),
  area_m2: z.number().positive('Luas harus lebih dari 0'),
  purchase_price: z.number().positive('Harga harus lebih dari 0'),
  purchase_date: z.string().min(1, 'Tanggal beli wajib diisi'),
  seller_name: z.string().optional(),
  certificate_number: z.string().optional(),
  current_value: z.number().optional(),
  pbb_due_month: z.number().optional(),
  notes: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export default function TambahTanahPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: FormData) {
    setLoading(true)
    setError('')
    const supabase = createClient()

    const { data: profile } = await supabase
      .from('profiles')
      .select('workspace_id')
      .single()

    if (!profile?.workspace_id) {
      setError('Workspace tidak ditemukan')
      setLoading(false)
      return
    }

    const { data: land, error: err } = await supabase
      .from('lands')
      .insert({
        workspace_id: profile.workspace_id,
        location: data.location,
        area_m2: data.area_m2,
        purchase_price: data.purchase_price,
        purchase_date: data.purchase_date,
        seller_name: data.seller_name || null,
        certificate_number: data.certificate_number || null,
        current_value: data.current_value || null,
        pbb_due_month: data.pbb_due_month || null,
        notes: data.notes || null,
      })
      .select()
      .single()

    if (err || !land) {
      setError('Gagal menyimpan data tanah')
      setLoading(false)
      return
    }

    // Buat entri dokumen default
    await supabase.from('land_documents').insert([
      { land_id: land.id, type: 'AJB', status: 'belum' },
      { land_id: land.id, type: 'SHM', status: 'belum' },
      { land_id: land.id, type: 'IMB', status: 'belum' },
      { land_id: land.id, type: 'PBB', status: 'belum' },
    ])

    router.push(`/phase1/tanah/${land.id}`)
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" render={<Link href="/phase1/tanah" />}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-xl font-semibold">Tambah Tanah</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {error && (
          <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">{error}</p>
        )}

        <Card>
          <CardHeader><CardTitle className="text-base">Informasi Tanah</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="location">Lokasi / Alamat *</Label>
              <Textarea id="location" placeholder="Jl. Contoh No. 1, Kelurahan, Kecamatan, Kota" rows={2} {...register('location')} />
              {errors.location && <p className="text-xs text-destructive">{errors.location.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="area_m2">Luas (m²) *</Label>
                <Input id="area_m2" type="number" step="0.01" placeholder="120" {...register('area_m2', { valueAsNumber: true })} />
                {errors.area_m2 && <p className="text-xs text-destructive">{errors.area_m2.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="purchase_date">Tanggal Beli *</Label>
                <Input id="purchase_date" type="date" {...register('purchase_date')} />
                {errors.purchase_date && <p className="text-xs text-destructive">{errors.purchase_date.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="purchase_price">Harga Beli (Rp) *</Label>
                <Input id="purchase_price" type="number" placeholder="150000000" {...register('purchase_price', { valueAsNumber: true })} />
                {errors.purchase_price && <p className="text-xs text-destructive">{errors.purchase_price.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="current_value">Estimasi Nilai Sekarang (Rp)</Label>
                <Input id="current_value" type="number" placeholder="200000000" {...register('current_value', { valueAsNumber: true })} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Dokumen & Identitas</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="seller_name">Nama Penjual</Label>
                <Input id="seller_name" placeholder="Budi Santoso" {...register('seller_name')} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="certificate_number">Nomor Sertifikat</Label>
                <Input id="certificate_number" placeholder="12345/Kel/2023" {...register('certificate_number')} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Bulan Jatuh Tempo PBB</Label>
              <Select onValueChange={(v) => setValue('pbb_due_month', parseInt(v as string))}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih bulan" />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((m, i) => (
                    <SelectItem key={i + 1} value={String(i + 1)}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="notes">Catatan</Label>
              <Textarea id="notes" placeholder="Catatan tambahan..." rows={3} {...register('notes')} />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3 justify-end">
          <Button variant="outline" render={<Link href="/phase1/tanah" />}>Batal</Button>
          <Button type="submit" disabled={loading}>{loading ? 'Menyimpan...' : 'Simpan Tanah'}</Button>
        </div>
      </form>
    </div>
  )
}
