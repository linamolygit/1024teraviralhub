// src/client/pages/admin/blog/AdminBlog.tsx
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Edit, Trash2, Eye, FileText, X, Save } from 'lucide-react'
import { adminApi, type BlogPost } from '../../../lib/api'
import { useAuthStore } from '../../../lib/auth-store'
import { formatDate } from '../../../lib/utils'
import { adminToast } from '../../../lib/admin-toast'
import LoadingSpinner from '../../../components/ui/LoadingSpinner'

export default function AdminBlog() {
  const { getToken } = useAuthStore()
  const qc = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null)

  const [form, setForm] = useState({
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    is_published: true,
    is_featured: false,
    author_name: 'Admin',
  })

  const { data, isLoading } = useQuery({
    queryKey: ['admin-blog'],
    queryFn: async () => {
      const token = await getToken()
      return adminApi.blog.list(token!)
    },
  })

  const saveMutation = useMutation({
    mutationFn: async () => {
      const token = await getToken()
      const payload = {
        ...form,
        is_published: form.is_published ? 1 : 0,
        is_featured: form.is_featured ? 1 : 0,
      }
      if (editingPost) {
        return adminApi.blog.update(token!, editingPost.id, payload)
      } else {
        return adminApi.blog.create(token!, payload)
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-blog'] })
      adminToast.success(
        editingPost ? 'Article Updated' : 'Article Published',
        `"${form.title}" has been saved successfully`
      )
      setModalOpen(false)
      setEditingPost(null)
      setForm({ title: '', slug: '', content: '', excerpt: '', is_published: true, is_featured: false, author_name: 'Admin' })
    },
    onError: (err: Error) => {
      adminToast.error('Save Failed', err.message)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const token = await getToken()
      return adminApi.blog.delete(token!, id)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-blog'] })
      adminToast.success('Article Deleted', 'The article has been permanently removed')
    },
    onError: (err: Error) => {
      adminToast.error('Deletion Failed', err.message)
    },
  })

  const openCreate = () => {
    setEditingPost(null)
    setForm({ title: '', slug: '', content: '', excerpt: '', is_published: true, is_featured: false, author_name: 'Admin' })
    setModalOpen(true)
  }

  const openEdit = (post: BlogPost) => {
    setEditingPost(post)
    setForm({
      title: post.title,
      slug: post.slug,
      content: post.content,
      excerpt: post.excerpt ?? '',
      is_published: post.is_published === 1,
      is_featured: post.is_featured === 1,
      author_name: post.author_name ?? 'Admin',
    })
    setModalOpen(true)
  }

  const handleTitleChange = (title: string) => {
    setForm(f => ({
      ...f,
      title,
      slug: f.slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
    }))
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 4 }}>Blog Posts</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Create and manage articles and SEO guides</p>
        </div>
        <button onClick={openCreate} className="btn-primary" style={{ fontSize: '0.875rem', padding: '10px 18px' }}>
          <Plus size={16} /> New Article
        </button>
      </div>

      {isLoading ? <LoadingSpinner /> : (
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Author</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data?.posts.map((post: BlogPost) => (
                  <tr key={post.id}>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{post.title}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>/blog/{post.slug}</div>
                    </td>
                    <td>{post.author_name}</td>
                    <td>
                      <span className={`badge ${post.is_published ? 'badge-success' : 'badge-amber'}`}>
                        {post.is_published ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{formatDate(post.created_at)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          onClick={() => openEdit(post)}
                          style={{ padding: '6px 8px', background: 'var(--bg-elevated)', border: '1px solid var(--bg-border)', borderRadius: 6, color: 'var(--brand-purple-light)', cursor: 'pointer' }}
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => { if (confirm('Delete article?')) deleteMutation.mutate(post.id) }}
                          style={{ padding: '6px 8px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 6, color: 'var(--error)', cursor: 'pointer' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!data?.posts.length && (
            <div className="empty-state">
              <FileText size={40} color="var(--text-muted)" style={{ marginBottom: 12 }} />
              <h3>No blog posts yet</h3>
              <button onClick={openCreate} className="btn-primary" style={{ marginTop: 16 }}>Create First Post</button>
            </div>
          )}
        </div>
      )}

      {/* Editor Modal */}
      {modalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 20 }}>
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-border)', borderRadius: 'var(--radius-xl)', padding: 28, maxWidth: 640, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>{editingPost ? 'Edit Post' : 'New Article'}</h2>
              <button onClick={() => setModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: 6, color: 'var(--text-secondary)' }}>Title *</label>
                <input className="input-field" value={form.title} onChange={e => handleTitleChange(e.target.value)} placeholder="Article headline" />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: 6, color: 'var(--text-secondary)' }}>Slug *</label>
                <input className="input-field" value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} placeholder="article-slug" />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: 6, color: 'var(--text-secondary)' }}>Excerpt</label>
                <textarea className="input-field" rows={2} value={form.excerpt} onChange={e => setForm(f => ({ ...f, excerpt: e.target.value }))} placeholder="Short summary" />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: 6, color: 'var(--text-secondary)' }}>Content (Markdown / HTML) *</label>
                <textarea className="input-field" rows={8} value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} placeholder="Article content..." />
              </div>

              <div style={{ display: 'flex', gap: 16 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.is_published} onChange={e => setForm(f => ({ ...f, is_published: e.target.checked }))} />
                  <span style={{ fontSize: '0.875rem' }}>Published</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.is_featured} onChange={e => setForm(f => ({ ...f, is_featured: e.target.checked }))} />
                  <span style={{ fontSize: '0.875rem' }}>Featured</span>
                </label>
              </div>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 12 }}>
                <button onClick={() => setModalOpen(false)} className="btn-ghost">Cancel</button>
                <button
                  onClick={() => saveMutation.mutate()}
                  className="btn-primary"
                  disabled={saveMutation.isPending || !form.title || !form.slug || !form.content}
                >
                  <Save size={16} /> {saveMutation.isPending ? 'Saving...' : 'Save Post'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
