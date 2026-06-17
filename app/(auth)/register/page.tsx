'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

const schema = z.object({
  name: z.string().min(2, 'Nama minimal 2 karakter'),
  email: z.string().email('Email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
  role: z.enum(['suami', 'istri'], { error: 'Pilih role' }),
})

type FormData = z.infer<typeof schema>

export default function RegisterPage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const selectedRole = watch('role')

  async function onSubmit(data: FormData) {
    setLoading(true)
    setError('')

    const supabase = createClient()

    // 1. Buat akun Supabase Auth
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
    })

    if (signUpError || !authData.user) {
      setError(signUpError?.message ?? 'Gagal membuat akun')
      setLoading(false)
      return
    }

    // 2. Buat workspace baru
    const { data: workspace, error: wsError } = await supabase
      .from('workspaces')
      .insert({ name: 'Keluarga Kami', created_by: authData.user.id })
      .select()
      .single()

    if (wsError || !workspace) {
      setError('Gagal membuat workspace')
      setLoading(false)
      return
    }

    // 3. Buat profil
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        name: data.name,
        role: data.role,
        workspace_id: workspace.id,
      })

    if (profileError) {
      setError('Gagal membuat profil')
      setLoading(false)
      return
    }

    router.push('/')
    router.refresh()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Buat Akun</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          {error && (
            <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
              {error}
            </p>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="name">Nama lengkap</Label>
            <Input id="name" placeholder="Nama kamu" {...register('name')} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="nama@email.com" {...register('email')} />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" {...register('password')} />
            {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Kamu adalah</Label>
            <div className="grid grid-cols-2 gap-2">
              {(['suami', 'istri'] as const).map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setValue('role', role)}
                  className={`px-4 py-2 rounded-md border text-sm font-medium transition-colors ${
                    selectedRole === role
                      ? 'bg-foreground text-background border-foreground'
                      : 'bg-background text-muted-foreground border-input hover:border-foreground'
                  }`}
                >
                  {role === 'suami' ? '👨 Suami' : '👩 Istri'}
                </button>
              ))}
            </div>
            {errors.role && <p className="text-xs text-destructive">{errors.role.message}</p>}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Membuat akun...' : 'Buat Akun'}
          </Button>
          <p className="text-sm text-muted-foreground text-center">
            Sudah punya akun?{' '}
            <Link href="/login" className="text-foreground underline underline-offset-4">
              Masuk
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}
