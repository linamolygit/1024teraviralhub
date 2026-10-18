// src/lib/highEcpmKeywords.ts — High eCPM & High-CPC Commercial Keyword Engine
// Curated high-paying programmatic advertising keywords for Google AdX (GAM) & Google AdSense

export interface HighEcpmNiche {
  id: string
  name: string
  icon: string
  cpmRange: string
  cpcRange: string
  description: string
  keywords: string[]
}

export const HIGH_ECPM_PRESET_NICHES: Record<string, HighEcpmNiche> = {
  fintech_payments: {
    id: 'fintech_payments',
    name: 'Fintech, UPI & Merchant Banking',
    icon: '💳',
    cpmRange: '$25 - $65 eCPM',
    cpcRange: '$4.50 - $18.00 CPC',
    description: 'High-value business banking, payment gateway integrations, instant UPI payouts, merchant checkout systems',
    keywords: [
      'payment gateway integration',
      'merchant payment processing',
      'upi payment gateway api',
      'instant payout gateway',
      'b2b payment solutions',
      'online payment aggregator',
      'fintech banking api',
      'pos terminal billing software',
      'corporate credit line',
      'ecommerce checkout optimization',
      'recurring subscription billing engine',
      'cross border remittance api',
      'virtual debit card issuing',
      'automated invoice financing',
      'merchant acquiring service',
      'real time payment settlement'
    ],
  },

  saas_cloud_hosting: {
    id: 'saas_cloud_hosting',
    name: 'Cloud VPS, Dedicated Servers & Hosting',
    icon: '☁️',
    cpmRange: '$22 - $55 eCPM',
    cpcRange: '$3.80 - $15.50 CPC',
    description: 'Enterprise cloud hosting, dedicated server infrastructure, high performance VPS, cloud database clustering',
    keywords: [
      'dedicated cloud server hosting',
      'enterprise kubernetes hosting',
      'high performance cloud vps',
      'managed wordpress cloud hosting',
      'cloud infrastructure automation',
      'scalable cloud storage api',
      'enterprise disaster recovery cloud',
      'hybrid cloud migration services',
      'ddos protected server hosting',
      'cloud database clustering',
      'serverless edge computing network',
      'enterprise web hosting solution'
    ],
  },

  cybersecurity_compliance: {
    id: 'cybersecurity_compliance',
    name: 'Cybersecurity, SSL & Data Compliance',
    icon: '🛡️',
    cpmRange: '$28 - $70 eCPM',
    cpcRange: '$5.00 - $22.00 CPC',
    description: 'Enterprise SSL certificates, PCI-DSS compliance, identity verification, zero-trust network security',
    keywords: [
      'enterprise ssl certificates',
      'pci dss compliance solutions',
      'cloud security posture management',
      'identity verification api',
      'end to end data tokenization',
      'zero trust network access',
      'fraud prevention machine learning',
      'enterprise cybersecurity audit',
      'automated kyc verification api',
      'data privacy compliance software'
    ],
  },

  digital_marketing_ads: {
    id: 'digital_marketing_ads',
    name: 'Digital Marketing, AdTech & CRM',
    icon: '📈',
    cpmRange: '$18 - $42 eCPM',
    cpcRange: '$2.50 - $11.00 CPC',
    description: 'Programmatic ad exchanges, header bidding wrappers, marketing automation CRM, conversion intelligence',
    keywords: [
      'programmatic ad exchange platform',
      'header bidding monetization wrapper',
      'enterprise crm marketing automation',
      'high cpm ad network demand',
      'omnichannel customer retention platform',
      'conversion rate optimization software',
      'ecommerce analytics intelligence',
      'customer data platform cdp',
      'ad mediation waterfall optimization',
      'performance marketing attribution'
    ],
  },

  ai_developer_tools: {
    id: 'ai_developer_tools',
    name: 'AI Automation, LLMs & Developer APIs',
    icon: '🤖',
    cpmRange: '$25 - $50 eCPM',
    cpcRange: '$3.50 - $14.00 CPC',
    description: 'Enterprise LLM APIs, automated cloud workflows, python developer tools, machine learning pipelines',
    keywords: [
      'enterprise generative ai api',
      'large language model inference hosting',
      'automated workflow orchestration',
      'python api developer tools',
      'rest api gateway management',
      'business intelligence data pipeline',
      'low code business automation',
      'ai model fine tuning cloud',
      'enterprise software development kit'
    ],
  },
}

export const DEFAULT_ACTIVE_NICHES = [
  'fintech_payments',
  'saas_cloud_hosting',
  'cybersecurity_compliance',
  'digital_marketing_ads',
  'ai_developer_tools',
]

/**
 * Combines keywords from selected niches + user custom keywords into a clean unique list
 */
export function compileHighEcpmKeywords(
  activeNiches: string[] = DEFAULT_ACTIVE_NICHES,
  customKeywordsStr: string = '',
  maxKeywords: number = 60
): string[] {
  const result: string[] = []
  const seen = new Set<string>()

  // 1. Add preset niche keywords
  for (const nicheId of activeNiches) {
    const niche = HIGH_ECPM_PRESET_NICHES[nicheId]
    if (niche && Array.isArray(niche.keywords)) {
      for (const kw of niche.keywords) {
        const clean = kw.trim().toLowerCase()
        if (clean && !seen.has(clean)) {
          seen.add(clean)
          result.push(clean)
        }
      }
    }
  }

  // 2. Add custom user keywords (comma or newline separated)
  if (customKeywordsStr && typeof customKeywordsStr === 'string') {
    const customList = customKeywordsStr.split(/[\n,]+/).map((k) => k.trim().toLowerCase())
    for (const kw of customList) {
      if (kw && !seen.has(kw)) {
        seen.add(kw)
        result.push(kw)
      }
    }
  }

  return result.slice(0, maxKeywords)
}
