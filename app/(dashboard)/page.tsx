import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('name, role')
    .eq('id', user.id)
    .single()

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold">Halo, {profile?.name ?? 'Kawan'} 👋</h1>
        <p className="text-muted-foreground">CasaFlow siap digunakan. Fitur sedang dibangun.</p>
      </div>
    </div>
  )
}
