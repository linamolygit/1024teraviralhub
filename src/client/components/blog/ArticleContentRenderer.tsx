// src/client/components/blog/ArticleContentRenderer.tsx — Elegant Blog Markdown to HTML Renderer
import React from 'react'

interface ArticleContentRendererProps {
  content: string
}

export default function ArticleContentRenderer({ content }: ArticleContentRendererProps) {
  if (!content) return null

  // Normalize newlines
  const text = content.replace(/\r\n/g, '\n')
  const blocks = splitIntoBlocks(text)

  return (
    <article className="prose-article" style={{ lineHeight: 1.85, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
      {blocks.map((block, idx) => (
        <React.Fragment key={idx}>{renderBlock(block, idx)}</React.Fragment>
      ))}
    </article>
  )
}

type Block =
  | { type: 'h2'; text: string }
  | { type: 'h3'; text: string }
  | { type: 'h4'; text: string }
  | { type: 'hr' }
  | { type: 'code'; language: string; code: string }
  | { type: 'table'; headers: string[]; rows: string[][] }
  | { type: 'ul'; items: string[] }
  | { type: 'ol'; items: string[] }
  | { type: 'p'; text: string }

function splitIntoBlocks(raw: string): Block[] {
  const lines = raw.split('\n')
  const blocks: Block[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]
    const trimmed = line.trim()

    // Empty lines
    if (!trimmed) {
      i++
      continue
    }

    // Horizontal Rule (---, ***, ___)
    if (/^(\-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      blocks.push({ type: 'hr' })
      i++
      continue
    }

    // Code Blocks (```)
    if (trimmed.startsWith('```')) {
      const language = trimmed.slice(3).trim()
      const codeLines: string[] = []
      i++
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i])
        i++
      }
      i++ // Skip closing ```
      blocks.push({ type: 'code', language, code: codeLines.join('\n') })
      continue
    }

    // Headings: ### H3, ## H2, # H1/H2
    if (trimmed.startsWith('#### ')) {
      blocks.push({ type: 'h4', text: trimmed.slice(5).trim() })
      i++
      continue
    }
    if (trimmed.startsWith('### ')) {
      blocks.push({ type: 'h3', text: trimmed.slice(4).trim() })
      i++
      continue
    }
    if (trimmed.startsWith('## ')) {
      blocks.push({ type: 'h2', text: trimmed.slice(3).trim() })
      i++
      continue
    }
    if (trimmed.startsWith('# ')) {
      blocks.push({ type: 'h2', text: trimmed.slice(2).trim() })
      i++
      continue
    }

    // Tables (| col 1 | col 2 |)
    if (trimmed.startsWith('|') && trimmed.endsWith('|') && i + 1 < lines.length && lines[i + 1].includes('---')) {
      const parseRow = (r: string) =>
        r
          .split('|')
          .slice(1, -1)
          .map((c) => c.trim())

      const headers = parseRow(trimmed)
      i += 2 // skip header + divider row (e.g. | :--- | :--- |)

      const rows: string[][] = []
      while (i < lines.length && lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) {
        rows.push(parseRow(lines[i].trim()))
        i++
      }
      blocks.push({ type: 'table', headers, rows })
      continue
    }

    // Unordered Lists (*, -, +)
    if (/^[\*\-\+]\s+/.test(trimmed)) {
      const items: string[] = []
      while (i < lines.length && /^[\*\-\+]\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[\*\-\+]\s+/, ''))
        i++
      }
      blocks.push({ type: 'ul', items })
      continue
    }

    // Ordered Lists (1., 2., etc.)
    if (/^\d+\.\s+/.test(trimmed)) {
      const items: string[] = []
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+\.\s+/, ''))
        i++
      }
      blocks.push({ type: 'ol', items })
      continue
    }

    // Normal Paragraph (accumulate until blank line or special block)
    const pLines: string[] = [line]
    i++
    while (
      i < lines.length &&
      lines[i].trim() &&
      !lines[i].trim().startsWith('#') &&
      !lines[i].trim().startsWith('```') &&
      !lines[i].trim().startsWith('|') &&
      !/^[\*\-\+]\s+/.test(lines[i].trim()) &&
      !/^\d+\.\s+/.test(lines[i].trim()) &&
      !/^(\-{3,}|\*{3,}|_{3,})$/.test(lines[i].trim())
    ) {
      pLines.push(lines[i])
      i++
    }
    blocks.push({ type: 'p', text: pLines.join(' ') })
  }

  return blocks
}

// Inline formatting parser: **bold**, *italic*, `code`, [link](url)
function formatInline(text: string): React.ReactNode[] {
  if (!text) return []

  // Replace links, code, bold, italic
  const tokens: React.ReactNode[] = []
  let remaining = text

  // Helper regex:
  // 1: `code`
  // 2: **bold**
  // 3: *italic*
  // 4: [link](url)
  const pattern = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/

  let keyCounter = 0

  while (remaining.length > 0) {
    const match = remaining.match(pattern)
    if (!match || match.index === undefined) {
      // Clean any accidental rogue markdown characters
      tokens.push(cleanText(remaining))
      break
    }

    // Text before match
    if (match.index > 0) {
      tokens.push(cleanText(remaining.slice(0, match.index)))
    }

    const matchedStr = match[0]

    if (matchedStr.startsWith('`') && matchedStr.endsWith('`')) {
      tokens.push(
        <code
          key={`c-${keyCounter++}`}
          style={{
            background: 'rgba(255, 210, 0, 0.12)',
            color: '#F59E0B',
            padding: '2px 7px',
            borderRadius: '5px',
            fontSize: '0.9em',
            fontFamily: 'monospace',
            border: '1px solid rgba(245, 158, 11, 0.25)',
          }}
        >
          {matchedStr.slice(1, -1)}
        </code>
      )
    } else if (matchedStr.startsWith('**') && matchedStr.endsWith('**')) {
      tokens.push(
        <strong key={`b-${keyCounter++}`} style={{ color: 'var(--text-primary)', fontWeight: 700 }}>
          {matchedStr.slice(2, -2)}
        </strong>
      )
    } else if (matchedStr.startsWith('*') && matchedStr.endsWith('*')) {
      tokens.push(
        <em key={`i-${keyCounter++}`} style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>
          {matchedStr.slice(1, -1)}
        </em>
      )
    } else if (matchedStr.startsWith('[') && matchedStr.includes('](')) {
      const linkMatch = matchedStr.match(/\[([^\]]+)\]\(([^)]+)\)/)
      if (linkMatch) {
        tokens.push(
          <a
            key={`a-${keyCounter++}`}
            href={linkMatch[2]}
            target={linkMatch[2].startsWith('http') ? '_blank' : undefined}
            rel="noopener noreferrer"
            style={{ color: 'var(--brand-purple-light, #7C3AED)', textDecoration: 'underline' }}
          >
            {linkMatch[1]}
          </a>
        )
      } else {
        tokens.push(matchedStr)
      }
    }

    remaining = remaining.slice(match.index + matchedStr.length)
  }

  return tokens
}

function cleanText(t: string): string {
  // Strip any accidental stray hashes or trailing asterisks
  return t.replace(/^#+\s*/g, '').replace(/\\n/g, ' ')
}

function renderBlock(block: Block, idx: number) {
  switch (block.type) {
    case 'h2':
      return (
        <h2
          key={idx}
          style={{
            fontSize: 'clamp(1.4rem, 2.5vw, 1.85rem)',
            fontWeight: 800,
            marginTop: '40px',
            marginBottom: '16px',
            color: 'var(--text-primary)',
            letterSpacing: '-0.015em',
            borderBottom: '1px solid var(--bg-border)',
            paddingBottom: '8px',
          }}
        >
          {formatInline(block.text)}
        </h2>
      )

    case 'h3':
      return (
        <h3
          key={idx}
          style={{
            fontSize: 'clamp(1.15rem, 2vw, 1.4rem)',
            fontWeight: 700,
            marginTop: '28px',
            marginBottom: '12px',
            color: 'var(--text-primary)',
          }}
        >
          {formatInline(block.text)}
        </h3>
      )

    case 'h4':
      return (
        <h4
          key={idx}
          style={{
            fontSize: '1.05rem',
            fontWeight: 700,
            marginTop: '20px',
            marginBottom: '8px',
            color: 'var(--text-secondary)',
          }}
        >
          {formatInline(block.text)}
        </h4>
      )

    case 'hr':
      return (
        <hr
          key={idx}
          style={{
            border: 'none',
            height: '1px',
            background: 'linear-gradient(90deg, transparent, var(--bg-border), transparent)',
            margin: '36px 0',
          }}
        />
      )

    case 'code':
      return (
        <div
          key={idx}
          style={{
            background: '#0F172A',
            border: '1px solid #1E293B',
            borderRadius: '10px',
            padding: '16px 20px',
            margin: '24px 0',
            overflowX: 'auto',
          }}
        >
          {block.language && (
            <div
              style={{
                fontSize: '0.72rem',
                color: '#64748B',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '8px',
                fontWeight: 700,
              }}
            >
              {block.language}
            </div>
          )}
          <pre style={{ margin: 0, fontFamily: 'monospace', fontSize: '0.875rem', color: '#E2E8F0', lineHeight: 1.6 }}>
            {block.code}
          </pre>
        </div>
      )

    case 'table':
      return (
        <div
          key={idx}
          style={{
            overflowX: 'auto',
            margin: '28px 0',
            borderRadius: '10px',
            border: '1px solid var(--bg-border)',
            background: 'var(--bg-elevated)',
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.925rem' }}>
            <thead>
              <tr style={{ background: 'rgba(255, 255, 255, 0.04)', borderBottom: '1px solid var(--bg-border)' }}>
                {block.headers.map((h, i) => (
                  <th key={i} style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {formatInline(h)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, rIdx) => (
                <tr
                  key={rIdx}
                  style={{
                    borderBottom: rIdx < block.rows.length - 1 ? '1px solid var(--bg-border)' : 'none',
                    background: rIdx % 2 === 1 ? 'rgba(255, 255, 255, 0.015)' : 'transparent',
                  }}
                >
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>
                      {formatInline(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )

    case 'ul':
      return (
        <ul
          key={idx}
          style={{
            paddingLeft: '24px',
            margin: '18px 0',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          {block.items.map((it, i) => (
            <li key={i} style={{ color: 'var(--text-secondary)' }}>
              {formatInline(it)}
            </li>
          ))}
        </ul>
      )

    case 'ol':
      return (
        <ol
          key={idx}
          style={{
            paddingLeft: '24px',
            margin: '18px 0',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          {block.items.map((it, i) => (
            <li key={i} style={{ color: 'var(--text-secondary)' }}>
              {formatInline(it)}
            </li>
          ))}
        </ol>
      )

    case 'p':
    default:
      return (
        <p key={idx} style={{ margin: '18px 0', color: 'var(--text-secondary)' }}>
          {formatInline(block.text)}
        </p>
      )
  }
}
