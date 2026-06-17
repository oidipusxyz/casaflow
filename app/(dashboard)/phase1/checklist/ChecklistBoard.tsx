'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { EmptyState } from '@/components/shared/EmptyState'
import { formatDate } from '@/lib/utils'
import { CheckSquare, Plus, Circle, Clock, CheckCircle2 } from 'lucide-react'

type Category = { id: string; name: string; color: string }
type Item = {
  id: string; category_id: string; title: string; assigned_to: string;
  status: string; due_date: string | null; notes: string | null
}

const STATUS_ICON = {
  belum_mulai: <Circle className="h-4 w-4 text-muted-foreground" />,
  dalam_proses: <Clock className="h-4 w-4 text-amber-500" />,
  selesai: <CheckCircle2 className="h-4 w-4 text-green-500" />,
}

const ASSIGNED_LABEL = { suami: 'Suami', istri: 'Istri', berdua: 'Berdua' }

interface Props {
  workspaceId: string
  weddingDate: string | null
  initialCategories: Category[]
  initialItems: Item[]
}

export function ChecklistBoard({ workspaceId, weddingDate, initialCategories, initialItems }: Props) {
  const router = useRouter()
  const [categories, setCategories] = useState(initialCategories)
  const [items, setItems] = useState(initialItems)
  const [addItemOpen, setAddItemOpen] = useState(false)
  const [addCatOpen, setAddCatOpen] = useState(false)
  const [newItem, setNewItem] = useState({ title: '', category_id: '', assigned_to: 'berdua', due_date: '', notes: '' })
  const [newCat, setNewCat] = useState('')
  const [saving, setSaving] = useState(false)

  const total = items.length
  const done = items.filter(i => i.status === 'selesai').length
  const percent = total ? Math.round((done / total) * 100) : 0

  async function cycleStatus(item: Item) {
    const next = { belum_mulai: 'dalam_proses', dalam_proses: 'selesai', selesai: 'belum_mulai' }
    const newStatus = next[item.status as keyof typeof next]
    const supabase = createClient()
    await supabase.from('checklist_items').update({
      status: newStatus,
      completed_at: newStatus === 'selesai' ? new Date().toISOString() : null,
    }).eq('id', item.id)
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: newStatus } : i))
  }

  async function addItem() {
    if (!newItem.title || !newItem.category_id) return
    setSaving(true)
    const supabase = createClient()
    const { data } = await supabase.from('checklist_items').insert({
      workspace_id: workspaceId,
      title: newItem.title,
      category_id: newItem.category_id,
      assigned_to: newItem.assigned_to,
      due_date: newItem.due_date || null,
      notes: newItem.notes || null,
      status: 'belum_mulai',
    }).select().single()
    if (data) setItems(prev => [...prev, data])
    setNewItem({ title: '', category_id: '', assigned_to: 'berdua', due_date: '', notes: '' })
    setAddItemOpen(false)
    setSaving(false)
  }

  async function addCategory() {
    if (!newCat) return
    setSaving(true)
    const supabase = createClient()
    const { data } = await supabase.from('checklist_categories').insert({
      workspace_id: workspaceId,
      name: newCat,
      color: '#6366f1',
    }).select().single()
    if (data) setCategories(prev => [...prev, data])
    setNewCat('')
    setAddCatOpen(false)
    setSaving(false)
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Checklist Nikah</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {weddingDate ? `Hari H: ${formatDate(weddingDate)}` : 'Set tanggal nikah di Pengaturan'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setAddCatOpen(true)}>
            + Kategori
          </Button>
          <Button size="sm" onClick={() => setAddItemOpen(true)} disabled={categories.length === 0}>
            <Plus className="h-4 w-4 mr-1" />Tambah Item
          </Button>
        </div>
      </div>

      {total > 0 && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{done} dari {total} selesai</span>
            <span className="font-medium">{percent}%</span>
          </div>
          <Progress value={percent} />
        </div>
      )}

      {categories.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title="Belum ada checklist"
          description="Tambah kategori dulu, lalu isi item-item yang perlu disiapkan."
          action={<Button onClick={() => setAddCatOpen(true)}>Tambah Kategori</Button>}
        />
      ) : (
        <div className="space-y-4">
          {categories.map((cat) => {
            const catItems = items.filter(i => i.category_id === cat.id)
            return (
              <Card key={cat.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold">{cat.name}</CardTitle>
                    <span className="text-xs text-muted-foreground">
                      {catItems.filter(i => i.status === 'selesai').length}/{catItems.length}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-1 pb-3">
                  {catItems.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-2">Belum ada item</p>
                  ) : (
                    catItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 py-2 px-1 rounded-md hover:bg-muted/50 cursor-pointer group"
                        onClick={() => cycleStatus(item)}
                      >
                        <button className="shrink-0">{STATUS_ICON[item.status as keyof typeof STATUS_ICON]}</button>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm ${item.status === 'selesai' ? 'line-through text-muted-foreground' : ''}`}>
                            {item.title}
                          </p>
                          {item.due_date && (
                            <p className="text-xs text-muted-foreground">{formatDate(item.due_date)}</p>
                          )}
                        </div>
                        <Badge variant="secondary" className="text-xs shrink-0">
                          {ASSIGNED_LABEL[item.assigned_to as keyof typeof ASSIGNED_LABEL]}
                        </Badge>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Dialog tambah item */}
      <Dialog open={addItemOpen} onOpenChange={setAddItemOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Tambah Item Checklist</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Nama item *</Label>
              <Input placeholder="Booking gedung" value={newItem.title} onChange={e => setNewItem(p => ({ ...p, title: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Kategori *</Label>
              <Select value={newItem.category_id} onValueChange={v => setNewItem(p => ({ ...p, category_id: v as string }))}>
                <SelectTrigger><SelectValue placeholder="Pilih kategori" /></SelectTrigger>
                <SelectContent>
                  {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Ditugaskan ke</Label>
                <Select value={newItem.assigned_to} onValueChange={v => setNewItem(p => ({ ...p, assigned_to: v as string }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="berdua">Berdua</SelectItem>
                    <SelectItem value="suami">Suami</SelectItem>
                    <SelectItem value="istri">Istri</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Deadline</Label>
                <Input type="date" value={newItem.due_date} onChange={e => setNewItem(p => ({ ...p, due_date: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Catatan</Label>
              <Textarea rows={2} value={newItem.notes} onChange={e => setNewItem(p => ({ ...p, notes: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddItemOpen(false)}>Batal</Button>
            <Button onClick={addItem} disabled={saving || !newItem.title || !newItem.category_id}>
              {saving ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog tambah kategori */}
      <Dialog open={addCatOpen} onOpenChange={setAddCatOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Tambah Kategori</DialogTitle></DialogHeader>
          <div className="space-y-1.5 py-2">
            <Label>Nama kategori</Label>
            <Input placeholder="Venue & Katering" value={newCat} onChange={e => setNewCat(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddCatOpen(false)}>Batal</Button>
            <Button onClick={addCategory} disabled={saving || !newCat}>{saving ? 'Menyimpan...' : 'Simpan'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
