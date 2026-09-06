// src/client/pages/admin/coupons/AdminCoupons.tsx
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Tag, Trash2, Check, X, Percent, DollarSign, Calendar } from 'lucide-react'
import { adminApi, type Coupon } from '../../../lib/api'
import { useAuthStore } from '../../../lib/auth-store'
import { formatPrice } from '../../../lib/utils'
import LoadingSpinner from '../../../components/ui/LoadingSpinner'
import { adminToast } from '../../../lib/admin-toast'

export default function AdminCoupons() {
  const { getToken } = useAuthStore()
  const qc = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    code: '',
    discount_type: 'percent' as 'percent' | 'fixed',
    discount_value: 10,
    min_spend: 0,
    max_uses: 0,
    expires_at: '',
  })

  const { data, isLoading } = useQuery({
    queryKey: ['admin-coupons'],
    queryFn: async () => {
      const token = await getToken()
      return adminApi.coupons.list(token!)
    },
  })

  const createMutation = useMutation({
    mutationFn: async () => {
      const token = await getToken()
      return adminApi.coupons.create(token!, {
        ...form,
        code: form.code.toUpperCase().trim(),
        expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
      })
    },
    onSuccess: () => {
      const code = form.code.toUpperCase().trim()
      qc.invalidateQueries({ queryKey: ['admin-coupons'] })
      setShowModal(false)
      setForm({ code: '', discount_type: 'percent', discount_value: 10, min_spend: 0, max_uses: 0, expires_at: '' })
      setError('')
      adminToast.success('Coupon Created', `Promo code "${code}" is now active.`)
    },
    onError: (err: Error) => {
      setError(err.message)
      adminToast.error('Coupon Creation Failed', err.message)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const token = await getToken()
      return adminApi.coupons.delete(token!, id)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-coupons'] })
      adminToast.success('Coupon Deleted', 'Promotional code has been removed.')
    },
    onError: (err: any) => {
      adminToast.error('Delete Failed', err?.message || 'Could not delete coupon.')
    },
  })

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: number; is_active: boolean }) => {
      const token = await getToken()
      return adminApi.coupons.update(token!, id, { is_active })
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['admin-coupons'] })
      adminToast.success('Status Updated', vars.is_active ? 'Coupon is now active.' : 'Coupon is now paused.')
    },
    onError: (err: any) => {
      adminToast.error('Update Failed', err?.message || 'Could not toggle coupon status.')
    },
  })

  if (isLoading) return <LoadingSpinner />

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Coupons & Discounts</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Create promotional discounts and coupon codes</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary" style={{ padding: '10px 18px' }}>
          <Plus size={16} /> Create Coupon
        </button>
      </div>

      {/* Coupons Table */}
      <div className="glass-card" style={{ overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--bg-border)', color: 'var(--text-muted)' }}>
              <th style={{ padding: '14px 16px' }}>Code</th>
              <th style={{ padding: '14px 16px' }}>Discount</th>
              <th style={{ padding: '14px 16px' }}>Min Spend</th>
              <th style={{ padding: '14px 16px' }}>Usage / Limit</th>
              <th style={{ padding: '14px 16px' }}>Expiry</th>
              <th style={{ padding: '14px 16px' }}>Status</th>
              <th style={{ padding: '14px 16px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {data?.coupons && data.coupons.length > 0 ? (
              data.coupons.map((coupon) => (
                <tr key={coupon.id} style={{ borderBottom: '1px solid var(--bg-border)' }}>
                  <td style={{ padding: '14px 16px', fontWeight: 700, color: 'var(--brand-purple-light)' }}>
                    {coupon.code}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    {coupon.discount_type === 'percent' ? `${coupon.discount_value}% OFF` : `₹${coupon.discount_value} OFF`}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    {coupon.min_spend > 0 ? formatPrice(coupon.min_spend) : 'No Min'}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    {coupon.used_count} / {coupon.max_uses > 0 ? coupon.max_uses : '∞'}
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {coupon.expires_at ? new Date(coupon.expires_at).toLocaleDateString() : 'Never'}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span
                      onClick={() => toggleStatusMutation.mutate({ id: coupon.id, is_active: !coupon.is_active })}
                      style={{
                        cursor: 'pointer', padding: '3px 8px', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: 700,
                        background: coupon.is_active ? 'linear-gradient(135deg, rgba(17, 98, 242, 0.15), rgba(124, 58, 237, 0.15))' : 'rgba(239,68,68,0.15)',
                        color: coupon.is_active ? '#1162F2' : '#EF4444',
                        border: coupon.is_active ? '1px solid rgba(17, 98, 242, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
                      }}
                    >
                      {coupon.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                    <button onClick={() => deleteMutation.mutate(coupon.id)} className="btn-ghost" style={{ padding: 6, color: '#EF4444' }}>
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>
                  No coupons created yet. Click "Create Coupon" to add one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create Modal */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20
        }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: 480, padding: 28 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Create New Coupon</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: 4 }}>Coupon Code *</label>
                <input className="input-field" placeholder="e.g. VIRAL50" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: 4 }}>Discount Type</label>
                  <select className="input-field" value={form.discount_type} onChange={e => setForm(f => ({ ...f, discount_type: e.target.value as any }))}>
                    <option value="percent">Percentage (%)</option>
                    <option value="fixed">Fixed (₹)</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: 4 }}>Discount Value *</label>
                  <input type="number" className="input-field" value={form.discount_value} onChange={e => setForm(f => ({ ...f, discount_value: parseFloat(e.target.value) || 0 }))} min="1" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: 4 }}>Min Spend (₹)</label>
                  <input type="number" className="input-field" value={form.min_spend} onChange={e => setForm(f => ({ ...f, min_spend: parseFloat(e.target.value) || 0 }))} min="0" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: 4 }}>Max Uses (0 = unlimited)</label>
                  <input type="number" className="input-field" value={form.max_uses} onChange={e => setForm(f => ({ ...f, max_uses: parseInt(e.target.value) || 0 }))} min="0" />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: 4 }}>Expiration Date (Optional)</label>
                <input type="date" className="input-field" value={form.expires_at} onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))} />
              </div>

              <button
                onClick={() => createMutation.mutate()}
                disabled={createMutation.isPending || !form.code || form.discount_value <= 0}
                className="btn-primary"
                style={{ marginTop: 12, padding: '12px' }}
              >
                {createMutation.isPending ? 'Creating...' : 'Save & Activate Coupon'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
