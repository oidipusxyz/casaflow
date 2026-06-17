import { createServiceClient } from '@/lib/supabase/server'
import { sendReminderEmail } from '@/lib/resend'
import { NextResponse } from 'next/server'

// Dipanggil Vercel Cron setiap tanggal 1, jam 08.00 WIB
// Cek tanah yang PBB-nya jatuh tempo bulan depan
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceClient()
  const nextMonth = new Date().getMonth() + 2 // bulan depan (1-indexed)

  const { data: lands, error } = await supabase
    .from('lands')
    .select('*, workspaces(name), profiles(email, name)')
    .eq('pbb_due_month', nextMonth > 12 ? 1 : nextMonth)

  if (error) {
    console.error('[reminder-pbb] Error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // TODO: kirim email ke masing-masing user berdasarkan workspace
  console.log(`[reminder-pbb] Found ${lands?.length ?? 0} lands due next month`)

  return NextResponse.json({ success: true, count: lands?.length ?? 0 })
}
