// src/client/pages/admin/AdminAuditLogs.tsx
import { useQuery } from '@tanstack/react-query'
import { Shield } from 'lucide-react'
import { adminApi, type AuditLog } from '../../lib/api'
import { useAuthStore } from '../../lib/auth-store'
import { formatDate, timeAgo } from '../../lib/utils'
import LoadingSpinner from '../../components/ui/LoadingSpinner'

export default function AdminAuditLogs() {
  const { getToken } = useAuthStore()

  const { data, isLoading } = useQuery({
    queryKey: ['admin-audit-logs'],
    queryFn: async () => {
      const token = await getToken()
      return adminApi.audit.list(token!)
    },
  })

  if (isLoading) return <LoadingSpinner />

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 4 }}>Security & Audit Logs</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Immutable record of all administrative modifications</p>
      </div>

      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Admin</th>
                <th>Action</th>
                <th>Resource</th>
                <th>Target ID</th>
                <th>IP Address</th>
              </tr>
            </thead>
            <tbody>
              {(data?.logs || []).map((log: AuditLog) => (
                <tr key={log.id}>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    {formatDate(log.created_at)} ({timeAgo(log.created_at)})
                  </td>
                  <td style={{ fontSize: '0.875rem' }}>{log.admin_email || log.admin_uid}</td>
                  <td>
                    <span className={`badge ${log.action === 'CREATE' ? 'badge-success' : log.action === 'DELETE' ? 'badge-error' : 'badge-purple'}`}>
                      {log.action}
                    </span>
                  </td>
                  <td style={{ textTransform: 'capitalize', fontSize: '0.875rem' }}>{log.resource_type ?? '-'}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{log.resource_id ?? '-'}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{log.ip_address ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!(data?.logs?.length) && (
          <div className="empty-state">
            <Shield size={40} color="var(--text-muted)" style={{ marginBottom: 12 }} />
            <h3>No audit logs recorded yet</h3>
          </div>
        )}
      </div>
    </div>
  )
}
