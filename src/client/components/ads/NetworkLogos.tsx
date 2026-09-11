// src/client/components/ads/NetworkLogos.tsx — Official Ad Network Brand Logos & Badges
import React from 'react'

interface NetworkLogoProps {
  provider: string
  size?: number
  className?: string
  style?: React.CSSProperties
}

/**
 * Official brand logos for ad monetization networks
 */
export function NetworkLogo({ provider, size = 24, className = '', style }: NetworkLogoProps) {
  const norm = (provider || '').toLowerCase().trim()

  // 1. Monetag — Official Lime Green (#A4D65E) Emblem
  if (norm.includes('monetag') || norm.includes('propeller')) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        style={{
          borderRadius: 6,
          flexShrink: 0,
          background: '#0F1A12',
          padding: 2,
          border: '1px solid rgba(164, 214, 94, 0.25)',
          ...style,
        }}
        aria-label="Monetag"
      >
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M24.2961 22.1034L21.0579 18.7237C19.8543 19.7647 18.7081 20.2496 16.9743 20.2638C15.0257 20.2638 13.6502 19.5793 12.9624 18.1533L25.6 15.7433C25.5714 9.99644 21.3015 6.77362 16.2006 6.77362C10.5839 6.77362 6.40002 10.5383 6.40002 15.8431C6.40002 21.1052 10.4836 24.9697 16.7881 24.9697C20.1552 24.9697 22.634 23.9857 24.2961 22.1034ZM9.17973 4.93405H13.292L16.1003 2.46703L18.9087 4.93405H23.0209L18.7797 0H13.4209L9.17973 4.93405ZM19.6538 13.5758L12.4752 14.9733C12.6758 12.4777 14.1087 11.1515 16.2293 11.1373C17.9487 11.1373 19.2239 12.107 19.6538 13.5758ZM19.0806 27.0659L16.2723 29.533L13.4639 27.0659H9.35168L13.5929 32H18.9517L23.1929 27.0659H19.0806Z"
          fill="#A4D65E"
        />
      </svg>
    )
  }

  // 2. Adsterra — Official Geometric A Symbol (Vector SVG)
  if (norm.includes('adsterra')) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 25 26"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        style={{
          borderRadius: 6,
          flexShrink: 0,
          background: '#181215',
          padding: 2,
          border: '1px solid rgba(253, 67, 5, 0.25)',
          ...style,
        }}
        aria-label="Adsterra"
      >
        <path
          d="M24.9263 24.8082L15.9112 0.926335C15.6706 0.306226 15.2165 0 14.5646 0H10.4393C9.78733 0 9.33328 0.302398 9.08103 0.926335L0.0776159 24.8082L0 25.1374C0 25.3594 0.0776157 25.5508 0.228966 25.6886C0.380317 25.8379 0.562713 25.9144 0.787798 25.9144H4.24946C4.32319 25.9106 4.40081 25.903 4.47842 25.8915C4.72291 25.8532 4.95576 25.7498 5.1692 25.6312L12.2128 21.6694C12.3758 21.5775 12.5776 21.5775 12.7406 21.6694L19.8192 25.6427C20.021 25.7575 20.2383 25.8494 20.4672 25.8915C20.5992 25.9144 20.735 25.9259 20.8631 25.9259C20.9446 25.9259 21.0261 25.9221 21.1037 25.9144H24.2083C24.4101 25.9144 24.5886 25.8379 24.7555 25.6886C24.9146 25.5508 25 25.3594 25 25.1374L24.9263 24.8082ZM12.2206 16.8999L7.40453 19.6138C7.28811 19.6789 7.1484 19.5641 7.19497 19.4377L12.3603 5.56184C12.4069 5.43552 12.5854 5.43552 12.6358 5.56184L17.7856 19.4377C17.8322 19.5641 17.6964 19.6789 17.5761 19.6138L12.7561 16.8999C12.5854 16.808 12.3836 16.808 12.2206 16.8999Z"
          fill="url(#adsterra_official_grad)"
        />
        <defs>
          <linearGradient id="adsterra_official_grad" x1="0.00089258" y1="12.9667" x2="25.0035" y2="12.9667" gradientUnits="userSpaceOnUse">
            <stop stopColor="#C73414" />
            <stop offset="0.0756" stopColor="#C52F0F" />
            <stop offset="1" stopColor="#FD4305" />
          </linearGradient>
        </defs>
      </svg>
    )
  }

  // 3. Google AdX / Google Ad Manager — Official Logo
  if (norm.includes('adx') || norm.includes('ad manager') || norm.includes('gam')) {
    return (
      <img
        src="/assets/ads/google-adx.webp"
        alt="Google AdX"
        width={size}
        height={size}
        className={className}
        style={{
          width: size,
          height: size,
          objectFit: 'contain',
          borderRadius: 6,
          background: '#FFFFFF',
          padding: 2,
          flexShrink: 0,
          border: '1px solid rgba(26, 115, 232, 0.3)',
          ...style,
        }}
        onError={(e) => {
          // Fallback to hosted webp
          ;(e.currentTarget as HTMLImageElement).src = 'https://adsparc.com/wp-content/uploads/2022/03/google-adx-logo-1-1.webp'
        }}
      />
    )
  }

  // 4. Google AdSense — Official Brand Logo
  if (norm.includes('adsense') || norm.includes('google')) {
    return (
      <img
        src="/assets/ads/adsense.png"
        alt="Google AdSense"
        width={size}
        height={size}
        className={className}
        style={{
          width: size,
          height: size,
          objectFit: 'contain',
          borderRadius: 6,
          background: '#FFFFFF',
          padding: 2,
          flexShrink: 0,
          border: '1px solid rgba(226, 232, 240, 0.8)',
          ...style,
        }}
        onError={(e) => {
          // Fallback if local asset is loading
          ;(e.currentTarget as HTMLElement).style.display = 'none'
        }}
      />
    )
  }

  // 4. PopAds — Official Brand Logo
  if (norm.includes('popads')) {
    return (
      <img
        src="/assets/ads/popads.webp"
        alt="PopAds"
        width={size}
        height={size}
        className={className}
        style={{
          width: size,
          height: size,
          objectFit: 'contain',
          borderRadius: 6,
          background: '#1C1917',
          padding: 2,
          flexShrink: 0,
          border: '1px solid rgba(239, 68, 68, 0.3)',
          ...style,
        }}
      />
    )
  }

  // 5. HilltopAds — Official Brand Logo
  if (norm.includes('hilltop')) {
    return (
      <img
        src="/assets/ads/hilltopads.webp"
        alt="HilltopAds"
        width={size}
        height={size}
        className={className}
        style={{
          width: size,
          height: size,
          objectFit: 'contain',
          borderRadius: 6,
          background: '#022C22',
          padding: 2,
          flexShrink: 0,
          border: '1px solid rgba(20, 184, 166, 0.3)',
          ...style,
        }}
      />
    )
  }

  // 6. Default / Custom / Direct Link
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{
        borderRadius: 6,
        flexShrink: 0,
        background: '#2E1065',
        border: '1px solid rgba(168, 85, 247, 0.3)',
        ...style,
      }}
      aria-label="Custom Ad Network"
    >
      <rect width="40" height="40" rx="8" fill="#2E1065" />
      <path
        d="M13 16L9 20L13 24M27 16L31 20L27 24M22 13L18 27"
        stroke="#A855F7"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/**
 * Formatted provider name badge with official color branding
 */
export function NetworkBadge({ provider, displayName }: { provider: string; displayName?: string }) {
  const norm = (provider || '').toLowerCase().trim()
  const isMonetag = norm.includes('monetag') || norm.includes('propeller')

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <NetworkLogo provider={provider} size={22} />
      <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.875rem' }}>
        {displayName || (isMonetag ? 'Monetag' : provider)}
      </span>
      {isMonetag && (
        <span
          style={{
            fontSize: '0.68rem',
            padding: '1px 6px',
            borderRadius: 4,
            background: 'rgba(164, 214, 94, 0.14)',
            color: '#A4D65E',
            border: '1px solid rgba(164, 214, 94, 0.3)',
            fontWeight: 700,
          }}
        >
          OFFICIAL
        </span>
      )}
    </div>
  )
}

