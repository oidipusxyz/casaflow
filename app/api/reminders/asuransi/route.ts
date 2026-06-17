import { createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Dipanggil Vercel Cron setiap hari jam 08.00 WIB
// Cek premi yang jatuh tempo dalam 7 hari & polis yang akan berakhir dalam 30 hari
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceClient()
  const today = new Date()

  const in7Days = new Date(today)
  in7Days.setDate(today.getDate() + 7)

  const in30Days = new Date(today)
  in30Days.setDate(today.getDate() + 30)

  const { data: policies, error } = await supabase
    .from('insurance_policies')
    .select('*')
    .eq('is_active', true)
    .lte('end_date', in30Days.toISOString().split('T')[0])

  if (error) {
    console.error('[reminder-asuransi] Error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // TODO: kirim email berdasarkan urgency
  console.log(`[reminder-asuransi] Found ${policies?.length ?? 0} policies expiring soon`)

  return NextResponse.json({ success: true, count: policies?.length ?? 0 })
}
