'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { StatCard } from '@/components/shared/StatCard'
import { EmptyState } from '@/components/shared/EmptyState'
import { formatRupiah } from '@/lib/utils'
import { Wallet, Plus, ChevronDown, ChevronRight } from 'lucide-react'

type Category = { id: string; name: string; estimated_amount: number; notes: string | null }
type Payment = { id: string; category_id: string; description: string; amount: number; payment_type: string | null; paid_by: string | null; payment_date: string | null }

const PAID_BY_LABEL: Record<string, string> = {
  suami: 'Suami', istri: 'Istri', ortu_suami: 'Ortu Suami',
  ortu_istri: 'Ortu Istri', bersama: 'Bersama',
}

interface Props {
  workspaceId: string
  initialCategories: Category[]
  initialPayments: Payment[]
}

export function AnggaranBoard({ workspaceId, initialCategories, initialPayments }: Props) {
  const [categories, setCategories] = useState(initialCategories)
  const [payments, setPayments] = useState(initialPayments)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [addCatOpen, setAddCatOpen] = useState(false)
  const [addPayOpen, setAddPayOpen] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [newCat, setNewCat] = useState({ name: '', estimated_amount: '' })
  const [newPay, setNewPay] = useState({ description: '', amount: '', payment_type: 'lunas', paid_by: 'bersama', payment_date: '' })

  const totalEstimasi = categories.reduce((s, c) => s + (c.estimated_amount ?? 0), 0)
  const totalRealisasi = payments.reduce((s, p) => s + p.amount, 0)
  const selisih = totalEstimasi - totalRealisasi

  async function addCategory() {
    if (!newCat.name) return
    setSaving(true)
    const supabase = createClient()
    const { data } = await supabase.from('budget_categories').insert({
      workspace_id: workspaceId,
      name: newCat.name,
      estimated_amount: parseInt(newCat.estimated_amount) || 0,
    }).select().single()
    if (data) setCategories(p => [...p, data])
    setNewCat({ name: '', estimated_amount: '' })
    setAddCatOpen(false)
    setSaving(false)
  }

  async function addPayment(categoryId: string) {
    if (!newPay.description || !newPay.amount) return
    setSaving(true)
    const supabase = createClient()
    const { data } = await supabase.from('budget_payments').insert({
      workspace_id: workspaceId,
      category_id: categoryId,
      description: newPay.description,
      amount: parseInt(newPay.amount),
      payment_type: newPay.payment_type,
      paid_by: newPay.paid_by,
      payment_date: newPay.payment_date || null,
    }).select().single()
    if (data) setPayments(p => [data, ...p])
    setNewPay({ description: '', amount: '', payment_type: 'lunas', paid_by: 'bersama', payment_date: '' })
    setAddPayOpen(null)
    setSaving(false)
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Anggaran Nikah</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Estimasi vs realisasi biaya pernikahan</p>
        </div>
        <Button onClick={() => setAddCatOpen(true)}>
          <Plus className="h-4 w-4 mr-1.5" />Tambah Pos
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Total Estimasi" value={formatRupiah(totalEstimasi)} />
        <StatCard label="Total Realisasi" value={formatRupiah(totalRealisasi)} />
        <StatCard
          label="Selisih"
          value={formatRupiah(Math.abs(selisih))}
          sub={selisih >= 0 ? 'sisa dari estimasi' : 'melebihi estimasi'}
        />
      </div>

      {categories.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="Belum ada pos anggaran"
          description="Tambah pos biaya seperti gedung, katering, foto/video, dll."
          action={<Button onClick={() => setAddCatOpen(true)}>Tambah Pos Pertama</Button>}
        />
      ) : (
        <div className="space-y-3">
          {categories.map((cat) => {
            const catPayments = payments.filter(p => p.category_id === cat.id)
            const realisasi = catPayments.reduce((s, p) => s + p.amount, 0)
            const isExpanded = expanded[cat.id]
            const overBudget = cat.estimated_amount > 0 && realisasi > cat.estimated_amount

            return (
              <Card key={cat.id}>
                <CardHeader
                  className="pb-2 cursor-pointer"
                  onClick={() => setExpanded(p => ({ ...p, [cat.id]: !p[cat.id] }))}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                      <CardTitle className="text-sm">{cat.name}</CardTitle>
                      {overBudget && <Badge variant="destructive" className="text-xs">Melebihi</Badge>}
                    </div>
                    <div className="text-right text-sm shrink-0">
                      <span className="font-medium">{formatRupiah(realisasi)}</span>
                      {cat.estimated_amount > 0 && (
                        <span className="text-muted-foreground"> / {formatRupiah(cat.estimated_amount)}</span>
                      )}
                    </div>
                  </div>
                </CardHeader>

                {isExpanded && (
                  <CardContent className="pt-0 space-y-2 pb-3">
                    {catPayments.map((pay) => (
                      <div key={pay.id} className="flex items-center justify-between text-sm py-1.5 border-b last:border-0">
                        <div>
                          <p>{pay.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {pay.payment_type} · {PAID_BY_LABEL[pay.paid_by ?? ''] ?? pay.paid_by}
                            {pay.payment_date ? ` · ${pay.payment_date}` : ''}
                          </p>
                        </div>
                        <span className="font-medium shrink-0">{formatRupiah(pay.amount)}</span>
                      </div>
                    ))}
                    <Button size="sm" variant="outline" className="w-full mt-2" onClick={() => setAddPayOpen(cat.id)}>
                      <Plus className="h-3.5 w-3.5 mr-1.5" />Tambah Pembayaran
                    </Button>
                  </CardContent>
                )}
              </Card>
            )
          })}
        </div>
      )}

      {/* Dialog tambah kategori */}
      <Dialog open={addCatOpen} onOpenChange={setAddCatOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Tambah Pos Anggaran</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Nama pos *</Label>
              <Input placeholder="Venue & Gedung" value={newCat.name} onChange={e => setNewCat(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Estimasi biaya (Rp)</Label>
              <Input type="number" placeholder="50000000" value={newCat.estimated_amount} onChange={e => setNewCat(p => ({ ...p, estimated_amount: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddCatOpen(false)}>Batal</Button>
            <Button onClick={addCategory} disabled={saving || !newCat.name}>{saving ? 'Menyimpan...' : 'Simpan'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog tambah pembayaran */}
      <Dialog open={!!addPayOpen} onOpenChange={() => setAddPayOpen(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Tambah Pembayaran</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Keterangan *</Label>
              <Input placeholder="DP Gedung, Pelunasan katering, dll" value={newPay.description} onChange={e => setNewPay(p => ({ ...p, description: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Jumlah (Rp) *</Label>
              <Input type="number" placeholder="5000000" value={newPay.amount} onChange={e => setNewPay(p => ({ ...p, amount: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Tipe</Label>
                <Select value={newPay.payment_type} onValueChange={v => setNewPay(p => ({ ...p, payment_type: v as string }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DP">DP</SelectItem>
                    <SelectItem value="cicilan">Cicilan</SelectItem>
                    <SelectItem value="lunas">Lunas</SelectItem>
                    <SelectItem value="lainnya">Lainnya</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Dibayar oleh</Label>
                <Select value={newPay.paid_by} onValueChange={v => setNewPay(p => ({ ...p, paid_by: v as string }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bersama">Bersama</SelectItem>
                    <SelectItem value="suami">Suami</SelectItem>
                    <SelectItem value="istri">Istri</SelectItem>
                    <SelectItem value="ortu_suami">Ortu Suami</SelectItem>
                    <SelectItem value="ortu_istri">Ortu Istri</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Tanggal bayar</Label>
              <Input type="date" value={newPay.payment_date} onChange={e => setNewPay(p => ({ ...p, payment_date: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddPayOpen(null)}>Batal</Button>
            <Button onClick={() => addPayOpen && addPayment(addPayOpen)} disabled={saving || !newPay.description || !newPay.amount}>
              {saving ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
