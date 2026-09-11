// src/client/components/product/ProductDeliveryPolicy.tsx — Digital Delivery & Access Policy Guarantee
import { ShieldCheck, Clock, Download, RefreshCw } from 'lucide-react'
import { Link } from 'react-router-dom'
import { usePaymentGatewayInfo } from '../../lib/payment-gateway-config'

interface Props {
  accessHours?: number
  downloadLimit?: number
}

export default function ProductDeliveryPolicy({ accessHours = 12, downloadLimit = 3 }: Props) {
  const { deliveryPolicyText } = usePaymentGatewayInfo()

  return (
    <div
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--bg-border)',
        borderRadius: 'var(--radius-xl)',
        padding: '24px',
        marginBottom: '28px',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
        <ShieldCheck size={20} color="#111827" />
        <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
          Digital Delivery & Access Window Policy
        </h4>
      </div>

      <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.65, marginBottom: '14px' }}>
        {deliveryPolicyText}
      </p>

      <div style={{ display: 'flex', gap: '18px', flexWrap: 'wrap', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <Clock size={14} color="var(--brand-amber)" /> Access active for {accessHours} hours
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <Download size={14} color="var(--success)" /> Up to {downloadLimit} download attempts
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <RefreshCw size={14} color="#111827" /> Recover link anytime via <Link to="/order-lookup" style={{ color: 'rgb(17, 98, 242)', textDecoration: 'underline', marginLeft: '4px' }}>Order Lookup</Link>
        </span>
      </div>
    </div>
  )
}
