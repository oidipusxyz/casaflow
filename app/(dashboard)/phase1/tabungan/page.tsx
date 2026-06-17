import { createClient } from '@/lib/supabase/server'
import { TabunganBoard } from './TabunganBoard'

export default async function TabunganPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('workspace_id')
    .eq('id', user!.id)
    .single()

  const workspaceId = profile!.workspace_id

  const { data: workspace } = await supabase
    .from('workspaces')
    .select('wedding_date')
    .eq('id', workspaceId)
    .single()

  const [{ data: goals }, { data: deposits }] = await Promise.all([
    supabase.from('savings_goals').select('*').eq('workspace_id', workspaceId).order('created_at'),
    supabase.from('savings_deposits').select('*').eq('workspace_id', workspaceId).order('deposit_date', { ascending: false }),
  ])

  return (
    <TabunganBoard
      workspaceId={workspaceId}
      weddingDate={workspace?.wedding_date ?? null}
      initialGoals={goals ?? []}
      initialDeposits={deposits ?? []}
    />
  )
}
