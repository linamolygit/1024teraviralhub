// src/client/pages/admin/users/AdminUsers.tsx
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { UserPlus, Shield, Trash2, X, Check, Mail, User } from 'lucide-react'
import { adminApi, type AdminStaffUser } from '../../../lib/api'
import { useAuthStore } from '../../../lib/auth-store'
import { adminToast } from '../../../lib/admin-toast'
import LoadingSpinner from '../../../components/ui/LoadingSpinner'

export default function AdminUsers() {
  const { getToken } = useAuthStore()
  const qc = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    firebase_uid: '',
    email: '',
    name: '',
    role: 'admin' as 'super_admin' | 'admin' | 'content_manager' | 'support_manager',
  })

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const token = await getToken()
      return adminApi.users.list(token!)
    },
  })

  const createMutation = useMutation({
    mutationFn: async () => {
      const token = await getToken()
      return adminApi.users.create(token!, form)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-users'] })
      adminToast.success('Staff Member Added', `${form.name || form.email} assigned as ${form.role.replace('_', ' ')}`)
      setShowModal(false)
      setForm({ firebase_uid: '', email: '', name: '', role: 'admin' })
      setError('')
    },
    onError: (err: Error) => {
      setError(err.message)
      adminToast.error('Failed to Add Staff', err.message)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const token = await getToken()
      return adminApi.users.delete(token!, id)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-users'] })
      adminToast.success('Access Revoked', 'Staff member permissions have been permanently removed')
    },
    onError: (err: Error) => {
      adminToast.error('Revocation Failed', err.message)
    },
  })

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: number; is_active: boolean }) => {
      const token = await getToken()
      return adminApi.users.update(token!, id, { is_active })
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['admin-users'] })
      adminToast.success(
        vars.is_active ? 'Account Activated' : 'Account Disabled',
        `User access has been ${vars.is_active ? 'enabled' : 'restricted'}`
      )
    },
    onError: (err: Error) => {
      adminToast.error('Status Update Failed', err.message)
    },
  })

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'super_admin':
        return <span className="badge badge-amber">👑 Super Admin</span>
      case 'admin':
        return <span className="badge badge-purple">🛠️ Admin</span>
      case 'content_manager':
        return <span className="badge" style={{ background: 'rgba(59,130,246,0.15)', color: '#60A5FA' }}>📝 Content Mgr</span>
      case 'support_manager':
        return <span className="badge" style={{ background: 'linear-gradient(135deg, rgba(17,98,242,0.15), rgba(124,58,237,0.15))', color: '#1162F2', border: '1px solid rgba(17,98,242,0.3)' }}>🎧 Support Mgr</span>
      default:
        return <span className="badge">{role}</span>
    }
  }

  if (isLoading) return <LoadingSpinner />

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Staff & Roles</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Manage team members, roles, and administrative permissions</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary" style={{ padding: '10px 18px' }}>
          <UserPlus size={16} /> Add Team Member
        </button>
      </div>

      {/* Team Table */}
      <div className="glass-card" style={{ overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--bg-border)', color: 'var(--text-muted)' }}>
              <th style={{ padding: '14px 16px' }}>Name & Email</th>
              <th style={{ padding: '14px 16px' }}>Role</th>
              <th style={{ padding: '14px 16px' }}>Firebase UID</th>
              <th style={{ padding: '14px 16px' }}>Status</th>
              <th style={{ padding: '14px 16px' }}>Last Login</th>
              <th style={{ padding: '14px 16px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {data?.users && data.users.length > 0 ? (
              data.users.map((user) => (
                <tr key={user.id} style={{ borderBottom: '1px solid var(--bg-border)' }}>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{user.name || 'Team Member'}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{user.email}</div>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    {getRoleBadge(user.role)}
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                    {user.firebase_uid.slice(0, 14)}...
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span
                      onClick={() => toggleStatusMutation.mutate({ id: user.id, is_active: !user.is_active })}
                      style={{
                        cursor: 'pointer', padding: '3px 8px', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: 700,
                        background: user.is_active ? 'linear-gradient(135deg, rgba(17,98,242,0.15), rgba(124,58,237,0.15))' : 'rgba(239,68,68,0.15)',
                        color: user.is_active ? '#1162F2' : '#EF4444',
                        border: user.is_active ? '1px solid rgba(17,98,242,0.3)' : '1px solid rgba(239,68,68,0.3)',
                      }}
                    >
                      {user.is_active ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                    {user.role !== 'super_admin' && (
                      <button onClick={() => deleteMutation.mutate(user.id)} className="btn-ghost" style={{ padding: 6, color: '#EF4444' }}>
                        <Trash2 size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>
                  No team members configured yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add Staff Modal */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20
        }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: 480, padding: 28 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Add Team Member</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: 4 }}>Full Name</label>
                <input className="input-field" placeholder="e.g. Rahul Sharma" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: 4 }}>Email Address *</label>
                <input type="email" className="input-field" placeholder="user@company.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: 4 }}>Firebase Auth UID *</label>
                <input className="input-field" placeholder="Copy from Firebase Authentication Console" value={form.firebase_uid} onChange={e => setForm(f => ({ ...f, firebase_uid: e.target.value.trim() }))} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: 4 }}>Assigned Role</label>
                <select className="input-field" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value as any }))}>
                  <option value="admin">🛠️ Admin (Store & Orders Management)</option>
                  <option value="content_manager">📝 Content Manager (Products & Blog only)</option>
                  <option value="support_manager">🎧 Support Manager (Orders & Downloads lookup)</option>
                  <option value="super_admin">👑 Super Admin (Full Unrestricted Access)</option>
                </select>
              </div>

              <button
                onClick={() => createMutation.mutate()}
                disabled={createMutation.isPending || !form.email || !form.firebase_uid}
                className="btn-primary"
                style={{ marginTop: 12, padding: '12px' }}
              >
                {createMutation.isPending ? 'Adding...' : 'Grant Access & Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
