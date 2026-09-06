// src/client/components/blog/BlogCategoryNav.tsx — Dynamic Blog Categories Filter Bar
interface CategoryItem {
  id: number
  name: string
  slug: string
  post_count?: number
}

interface Props {
  categories: CategoryItem[]
  activeCategory: string
  onSelectCategory: (slug: string) => void
}

export default function BlogCategoryNav({ categories, activeCategory, onSelectCategory }: Props) {
  return (
    <nav
      aria-label="Blog Categories"
      style={{
        display: 'flex',
        gap: '8px',
        overflowX: 'auto',
        paddingBottom: '8px',
        marginBottom: '36px',
        scrollbarWidth: 'none',
      }}
    >
      {/* "All Articles" Button */}
      <button
        type="button"
        onClick={() => onSelectCategory('')}
        style={{
          padding: '8px 16px',
          borderRadius: 'var(--radius-full)',
          fontSize: '0.8125rem',
          fontWeight: 700,
          whiteSpace: 'nowrap',
          cursor: 'pointer',
          border: '1px solid',
          borderColor: activeCategory === '' ? 'var(--brand-purple)' : 'var(--bg-border)',
          background: activeCategory === '' ? 'var(--brand-purple)' : 'var(--bg-elevated)',
          color: activeCategory === '' ? '#FFFFFF' : 'var(--text-secondary)',
          transition: 'all 0.15s ease',
        }}
      >
        All Articles
      </button>

      {/* Dynamic Categories */}
      {categories.map((cat) => {
        const isActive = activeCategory === cat.slug
        return (
          <button
            key={cat.id}
            type="button"
            onClick={() => onSelectCategory(cat.slug)}
            style={{
              padding: '8px 16px',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.8125rem',
              fontWeight: 700,
              whiteSpace: 'nowrap',
              cursor: 'pointer',
              border: '1px solid',
              borderColor: isActive ? 'var(--brand-purple)' : 'var(--bg-border)',
              background: isActive ? 'var(--brand-purple)' : 'var(--bg-elevated)',
              color: isActive ? '#FFFFFF' : 'var(--text-secondary)',
              transition: 'all 0.15s ease',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>{cat.name}</span>
            {cat.post_count !== undefined && cat.post_count > 0 && (
              <span
                style={{
                  fontSize: '0.7rem',
                  opacity: isActive ? 0.9 : 0.6,
                  background: isActive ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.06)',
                  padding: '2px 6px',
                  borderRadius: '10px',
                }}
              >
                {cat.post_count}
              </span>
            )}
          </button>
        )
      })}
    </nav>
  )
}
