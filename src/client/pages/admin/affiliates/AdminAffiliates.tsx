// src/client/pages/admin/affiliates/AdminAffiliates.tsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Share2, DollarSign, CheckCircle, ArrowUpRight } from 'lucide-react'
import { useAuthStore } from '../../../lib/auth-store'
import { formatPrice } from '../../../lib/utils'
import { adminToast } from '../../../lib/admin-toast'
import LoadingSpinner from '../../../components/ui/LoadingSpinner'

export default function AdminAffiliates() {
  const { getToken } = useAuthStore()
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['admin-affiliates'],
    queryFn: async () => {
      const token = await getToken()
      const res = await fetch('/api/admin/affiliates', {
        headers: { Authorization: `Bearer ${token}` },
      })
      return res.json() as Promise<{ partners: any[]; conversions: any[] }>
    },
  })

  const payoutMutation = useMutation({
    mutationFn: async (id: number) => {
      const token = await getToken()
      const res = await fetch(`/api/admin/affiliates/${id}/payout`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { message?: string }
        throw new Error(err.message || 'Failed to settle payout')
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-affiliates'] })
      adminToast.success('Payout Marked as Settled', 'Affiliate balance has been updated')
    },
    onError: (err: Error) => {
      adminToast.error('Payout Error', err.message)
    },
  })

  if (isLoading) return <LoadingSpinner />

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Affiliate Partners & Referrals</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Track affiliate conversions and approve UPI commission payouts</p>
      </div>

      {/* Partners List */}
      <div className="glass-card" style={{ overflow: 'hidden', marginBottom: 32 }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--bg-border)', fontWeight: 700 }}>
          Active Partners ({data?.partners?.length ?? 0})
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--bg-border)', color: 'var(--text-muted)' }}>
              <th style={{ padding: '14px 16px' }}>Partner Name</th>
              <th style={{ padding: '14px 16px' }}>Code</th>
              <th style={{ padding: '14px 16px' }}>UPI ID</th>
              <th style={{ padding: '14px 16px' }}>Total Earned</th>
              <th style={{ padding: '14px 16px' }}>Paid Out</th>
              <th style={{ padding: '14px 16px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {data?.partners && data.partners.length > 0 ? (
              data.partners.map((p) => {
                const pending = Math.max(0, (p.total_earnings || 0) - (p.paid_earnings || 0))
                return (
                  <tr key={p.id} style={{ borderBottom: '1px solid var(--bg-border)' }}>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: 700 }}>{p.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{p.email}</div>
                    </td>
                    <td style={{ padding: '14px 16px', color: 'var(--brand-purple-light)', fontWeight: 600 }}>
                      {p.code}
                    </td>
                    <td style={{ padding: '14px 16px', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                      {p.upi_id || 'Not provided'}
                    </td>
                    <td style={{ padding: '14px 16px', fontWeight: 700 }}>
                      {formatPrice(p.total_earnings || 0)}
                    </td>
                    <td style={{ padding: '14px 16px', color: 'var(--success)' }}>
                      {formatPrice(p.paid_earnings || 0)}
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      {pending > 0 ? (
                        <button onClick={() => payoutMutation.mutate(p.id)} className="btn-primary" style={{ padding: '6px 12px', fontSize: '0.75rem' }}>
                          Pay {formatPrice(pending)} via UPI
                        </button>
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Settled</span>
                      )}
                    </td>
                  </tr>
                )
              })
            ) : (
              <tr>
                <td colSpan={6} style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>
                  No affiliate partners registered yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
