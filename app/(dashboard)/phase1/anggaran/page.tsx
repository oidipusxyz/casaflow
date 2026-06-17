import { createClient } from '@/lib/supabase/server'
import { AnggaranBoard } from './AnggaranBoard'

export default async function AnggaranPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('workspace_id')
    .eq('id', user!.id)
    .single()

  const workspaceId = profile!.workspace_id

  const [{ data: categories }, { data: payments }] = await Promise.all([
    supabase
      .from('budget_categories')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('sort_order'),
    supabase
      .from('budget_payments')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false }),
  ])

  return (
    <AnggaranBoard
      workspaceId={workspaceId}
      initialCategories={categories ?? []}
      initialPayments={payments ?? []}
    />
  )
}
