// src/client/pages/admin/AdminDownloads.tsx
import { useQuery } from '@tanstack/react-query'
import { adminApi } from '../../lib/api'
import { useAuthStore } from '../../lib/auth-store'
import { timeAgo, formatDate } from '../../lib/utils'
import LoadingSpinner from '../../components/ui/LoadingSpinner'

export default function AdminDownloads() {
  const { getToken } = useAuthStore()

  const { data, isLoading } = useQuery({
    queryKey: ['admin-downloads'],
    queryFn: async () => {
      const token = await getToken()
      return adminApi.downloads.list(token!)
    },
  })

  if (isLoading) return <LoadingSpinner />

  return (
    <div>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 24 }}>Download Activity</h1>

      {(data?.suspicious_ips as {ip_address: string; attempts: number}[])?.length > 0 && (
        <div className="alert alert-warning" style={{ marginBottom: 24 }}>
          ⚠️ Suspicious IP addresses detected with multiple failed attempts in the last hour:
          {(data.suspicious_ips as {ip_address: string; attempts: number}[]).map(ip => (
            <span key={ip.ip_address} style={{ marginLeft: 8, fontFamily: 'monospace' }}>{ip.ip_address} ({ip.attempts}x)</span>
          ))}
        </div>
      )}

      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr><th>Time</th><th>Order</th><th>Customer</th><th>Product</th><th>IP</th><th>Status</th></tr>
            </thead>
            <tbody>
              {(data?.logs || []).map(log => (
                <tr key={log.id}>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{timeAgo(log.created_at)}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{log.order_number}</td>
                  <td style={{ fontSize: '0.875rem' }}>{log.customer_name}</td>
                  <td style={{ fontSize: '0.875rem' }}>{log.product_title}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{log.ip_address ?? '-'}</td>
                  <td><span className={`badge ${log.success ? 'badge-success' : 'badge-error'}`}>{log.success ? 'Success' : 'Failed'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!(data?.logs?.length) && <div className="empty-state"><div className="empty-state-icon">⬇️</div><h3>No downloads yet</h3></div>}
      </div>
    </div>
  )
}
