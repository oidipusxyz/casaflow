import { createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Dipanggil Vercel Cron setiap hari jam 08.00 WIB
// Menangani semua reminder: PBB, kontrakan, asuransi
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceClient()
  const today = new Date()
  const results: Record<string, number> = {}

  // ── PBB: cek setiap tanggal 1, kirim reminder bulan depan ──
  if (today.getDate() === 1) {
    const nextMonth = today.getMonth() + 2
    const { data: lands } = await supabase
      .from('lands')
      .select('id, location, pbb_due_month')
      .eq('pbb_due_month', nextMonth > 12 ? 1 : nextMonth)

    results.pbb = lands?.length ?? 0
    // TODO: kirim email per workspace
  }

  // ── Kontrakan: cek yang habis dalam 60 hari ──
  const in60Days = new Date(today)
  in60Days.setDate(today.getDate() + 60)

  const { data: contracts } = await supabase
    .from('rental_contracts')
    .select('id, address, end_date')
    .eq('status', 'aktif')
    .lte('end_date', in60Days.toISOString().split('T')[0])

  results.kontrakan = contracts?.length ?? 0
  // TODO: kirim email

  // ── Asuransi: cek polis yang berakhir dalam 30 hari ──
  const in30Days = new Date(today)
  in30Days.setDate(today.getDate() + 30)

  const { data: policies } = await supabase
    .from('insurance_policies')
    .select('id, product_name, end_date')
    .eq('is_active', true)
    .lte('end_date', in30Days.toISOString().split('T')[0])

  results.asuransi = policies?.length ?? 0
  // TODO: kirim email

  console.log('[reminders]', results)
  return NextResponse.json({ success: true, ...results })
}
