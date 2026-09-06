// src/client/pages/admin/reviews/AdminReviews.tsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Star, CheckCircle, Trash2, ShieldCheck, MessageSquare } from 'lucide-react'
import { adminApi, type Review } from '../../../lib/api'
import { useAuthStore } from '../../../lib/auth-store'
import { adminToast } from '../../../lib/admin-toast'
import LoadingSpinner from '../../../components/ui/LoadingSpinner'

export default function AdminReviews() {
  const { getToken } = useAuthStore()
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['admin-reviews'],
    queryFn: async () => {
      const token = await getToken()
      return adminApi.reviews.list(token!)
    },
  })

  const approveMutation = useMutation({
    mutationFn: async (id: number) => {
      const token = await getToken()
      return adminApi.reviews.approve(token!, id)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-reviews'] })
      adminToast.success('Review Approved', 'Customer review is now publicly visible')
    },
    onError: (err: Error) => {
      adminToast.error('Approval Failed', err.message)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const token = await getToken()
      return adminApi.reviews.delete(token!, id)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-reviews'] })
      adminToast.success('Review Deleted', 'The review has been removed')
    },
    onError: (err: Error) => {
      adminToast.error('Delete Failed', err.message)
    },
  })

  if (isLoading) return <LoadingSpinner />

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Customer Reviews</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Moderate customer feedback and ratings</p>
      </div>

      <div className="glass-card" style={{ overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--bg-border)', color: 'var(--text-muted)' }}>
              <th style={{ padding: '14px 16px' }}>Product</th>
              <th style={{ padding: '14px 16px' }}>Customer & Rating</th>
              <th style={{ padding: '14px 16px' }}>Review Comment</th>
              <th style={{ padding: '14px 16px' }}>Verified Buyer</th>
              <th style={{ padding: '14px 16px' }}>Date</th>
              <th style={{ padding: '14px 16px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {data?.reviews && data.reviews.length > 0 ? (
              data.reviews.map((rev) => (
                <tr key={rev.id} style={{ borderBottom: '1px solid var(--bg-border)' }}>
                  <td style={{ padding: '14px 16px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {rev.product_title || `Product #${rev.product_id}`}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ fontWeight: 700 }}>{rev.customer_name}</div>
                    <div style={{ display: 'flex', gap: 2, color: 'var(--brand-amber)', marginTop: 2 }}>
                      {Array.from({ length: rev.rating }).map((_, i) => (
                        <Star key={i} size={13} fill="currentColor" />
                      ))}
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px', color: 'var(--text-secondary)', maxWidth: 300, lineHeight: 1.4 }}>
                    "{rev.comment}"
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    {rev.is_verified_purchase ? (
                      <span className="badge badge-purple" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <ShieldCheck size={12} /> Verified
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Public</span>
                    )}
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {new Date(rev.created_at).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                    <button onClick={() => deleteMutation.mutate(rev.id)} className="btn-ghost" style={{ padding: 6, color: '#EF4444' }}>
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>
                  No customer reviews submitted yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
