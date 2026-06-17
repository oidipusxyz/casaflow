import { createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Dipanggil Vercel Cron setiap hari jam 08.00 WIB
// Cek kontrak yang habis dalam 60 atau 30 hari
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceClient()
  const today = new Date()

  const in60Days = new Date(today)
  in60Days.setDate(today.getDate() + 60)

  const in30Days = new Date(today)
  in30Days.setDate(today.getDate() + 30)

  const { data: contracts, error } = await supabase
    .from('rental_contracts')
    .select('*')
    .eq('status', 'aktif')
    .lte('end_date', in60Days.toISOString().split('T')[0])

  if (error) {
    console.error('[reminder-kontrakan] Error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // TODO: kirim email berdasarkan urgency (H-60 vs H-30)
  console.log(`[reminder-kontrakan] Found ${contracts?.length ?? 0} contracts expiring soon`)

  return NextResponse.json({ success: true, count: contracts?.length ?? 0 })
}
