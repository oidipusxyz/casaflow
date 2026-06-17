import { createClient } from '@/lib/supabase/server'
import { ChecklistBoard } from './ChecklistBoard'

export default async function ChecklistPage() {
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

  const [{ data: categories }, { data: items }] = await Promise.all([
    supabase
      .from('checklist_categories')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('sort_order'),
    supabase
      .from('checklist_items')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('due_date', { ascending: true }),
  ])

  return (
    <ChecklistBoard
      workspaceId={workspaceId}
      weddingDate={workspace?.wedding_date ?? null}
      initialCategories={categories ?? []}
      initialItems={items ?? []}
    />
  )
}
