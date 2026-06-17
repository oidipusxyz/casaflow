'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { differenceInMonths } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { StatCard } from '@/components/shared/StatCard'
import { EmptyState } from '@/components/shared/EmptyState'
import { formatRupiah, formatDate } from '@/lib/utils'
import { PiggyBank, Plus, Target } from 'lucide-react'

type Goal = { id: string; name: string; target_amount: number; target_date: string }
type Deposit = { id: string; goal_id: string; amount: number; deposit_date: string; deposited_by: string | null; notes: string | null }

const DEPOSITED_BY_LABEL: Record<string, string> = {
  suami: 'Suami', istri: 'Istri', ortu_suami: 'Ortu Suami',
  ortu_istri: 'Ortu Istri', lainnya: 'Lainnya',
}

interface Props {
  workspaceId: string
  weddingDate: string | null
  initialGoals: Goal[]
  initialDeposits: Deposit[]
}

export function TabunganBoard({ workspaceId, weddingDate, initialGoals, initialDeposits }: Props) {
  const [goals, setGoals] = useState(initialGoals)
  const [deposits, setDeposits] = useState(initialDeposits)
  const [addGoalOpen, setAddGoalOpen] = useState(false)
  const [addDepositOpen, setAddDepositOpen] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [newGoal, setNewGoal] = useState({ name: 'Dana Pernikahan', target_amount: '', target_date: weddingDate ?? '' })
  const [newDeposit, setNewDeposit] = useState({ amount: '', deposited_by: 'bersama', deposit_date: new Date().toISOString().split('T')[0], notes: '' })

  async function addGoal() {
    if (!newGoal.target_amount || !newGoal.target_date) return
    setSaving(true)
    const supabase = createClient()
    const { data } = await supabase.from('savings_goals').insert({
      workspace_id: workspaceId,
      name: newGoal.name,
      target_amount: parseInt(newGoal.target_amount),
      target_date: newGoal.target_date,
    }).select().single()
    if (data) setGoals(p => [...p, data])
    setAddGoalOpen(false)
    setSaving(false)
  }

  async function addDeposit(goalId: string) {
    if (!newDeposit.amount) return
    setSaving(true)
    const supabase = createClient()
    const { data } = await supabase.from('savings_deposits').insert({
      workspace_id: workspaceId,
      goal_id: goalId,
      amount: parseInt(newDeposit.amount),
      deposited_by: newDeposit.deposited_by,
      deposit_date: newDeposit.deposit_date,
      notes: newDeposit.notes || null,
    }).select().single()
    if (data) setDeposits(p => [data, ...p])
    setNewDeposit({ amount: '', deposited_by: 'bersama', deposit_date: new Date().toISOString().split('T')[0], notes: '' })
    setAddDepositOpen(null)
    setSaving(false)
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Tabungan Nikah</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Pantau progres menabung untuk pernikahan</p>
        </div>
        {goals.length === 0 && (
          <Button onClick={() => setAddGoalOpen(true)}>
            <Target className="h-4 w-4 mr-1.5" />Set Target
          </Button>
        )}
      </div>

      {goals.length === 0 ? (
        <EmptyState
          icon={PiggyBank}
          title="Belum ada target tabungan"
          description="Set target dana nikah dan mulai catat setiap setoran."
          action={<Button onClick={() => setAddGoalOpen(true)}>Set Target Sekarang</Button>}
        />
      ) : (
        goals.map((goal) => {
          const goalDeposits = deposits.filter(d => d.goal_id === goal.id)
          const totalTerkumpul = goalDeposits.reduce((s, d) => s + d.amount, 0)
          const sisa = goal.target_amount - totalTerkumpul
          const percent = Math.min(100, Math.round((totalTerkumpul / goal.target_amount) * 100))
          const sisaBulan = differenceInMonths(new Date(goal.target_date), new Date())
          const nabungPerBulan = sisaBulan > 0 ? Math.ceil(sisa / sisaBulan) : 0

          return (
            <div key={goal.id} className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-base">{goal.name}</CardTitle>
                    <span className="text-sm text-muted-foreground">Target: {formatDate(goal.target_date)}</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{formatRupiah(totalTerkumpul)} terkumpul</span>
                      <span className="font-medium">{percent}%</span>
                    </div>
                    <Progress value={percent} />
                    <p className="text-xs text-muted-foreground text-right">
                      Target: {formatRupiah(goal.target_amount)}
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <StatCard label="Terkumpul" value={formatRupiah(totalTerkumpul)} />
                    <StatCard label="Sisa" value={formatRupiah(Math.max(0, sisa))} />
                    <StatCard
                      label="Perlu/bulan"
                      value={sisaBulan > 0 ? formatRupiah(nabungPerBulan) : '—'}
                      sub={sisaBulan > 0 ? `${sisaBulan} bulan lagi` : percent >= 100 ? 'Target tercapai!' : 'Lewat deadline'}
                    />
                  </div>

                  <Button className="w-full" onClick={() => setAddDepositOpen(goal.id)}>
                    <Plus className="h-4 w-4 mr-1.5" />Catat Setoran
                  </Button>
                </CardContent>
              </Card>

              {goalDeposits.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Riwayat Setoran</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-0 pb-3">
                    {goalDeposits.map((d) => (
                      <div key={d.id} className="flex justify-between items-center py-2.5 border-b last:border-0 text-sm">
                        <div>
                          <p className="font-medium">{formatRupiah(d.amount)}</p>
                          <p className="text-xs text-muted-foreground">
                            {DEPOSITED_BY_LABEL[d.deposited_by ?? ''] ?? d.deposited_by} · {formatDate(d.deposit_date)}
                          </p>
                          {d.notes && <p className="text-xs text-muted-foreground">{d.notes}</p>}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          )
        })
      )}

      {/* Dialog set target */}
      <Dialog open={addGoalOpen} onOpenChange={setAddGoalOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Set Target Tabungan</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Nama tabungan</Label>
              <Input value={newGoal.name} onChange={e => setNewGoal(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Target dana (Rp) *</Label>
              <Input type="number" placeholder="150000000" value={newGoal.target_amount} onChange={e => setNewGoal(p => ({ ...p, target_amount: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Target tanggal (tanggal nikah) *</Label>
              <Input type="date" value={newGoal.target_date} onChange={e => setNewGoal(p => ({ ...p, target_date: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddGoalOpen(false)}>Batal</Button>
            <Button onClick={addGoal} disabled={saving || !newGoal.target_amount || !newGoal.target_date}>
              {saving ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog catat setoran */}
      <Dialog open={!!addDepositOpen} onOpenChange={() => setAddDepositOpen(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Catat Setoran</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Jumlah (Rp) *</Label>
              <Input type="number" placeholder="1000000" value={newDeposit.amount} onChange={e => setNewDeposit(p => ({ ...p, amount: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Dari siapa</Label>
                <Select value={newDeposit.deposited_by} onValueChange={v => setNewDeposit(p => ({ ...p, deposited_by: v as string }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="suami">Suami</SelectItem>
                    <SelectItem value="istri">Istri</SelectItem>
                    <SelectItem value="ortu_suami">Ortu Suami</SelectItem>
                    <SelectItem value="ortu_istri">Ortu Istri</SelectItem>
                    <SelectItem value="lainnya">Lainnya</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Tanggal</Label>
                <Input type="date" value={newDeposit.deposit_date} onChange={e => setNewDeposit(p => ({ ...p, deposit_date: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Catatan</Label>
              <Textarea rows={2} value={newDeposit.notes} onChange={e => setNewDeposit(p => ({ ...p, notes: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDepositOpen(null)}>Batal</Button>
            <Button onClick={() => addDepositOpen && addDeposit(addDepositOpen)} disabled={saving || !newDeposit.amount}>
              {saving ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
