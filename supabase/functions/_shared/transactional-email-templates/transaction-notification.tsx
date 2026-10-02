import * as React from 'npm:react@18.3.1'
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  fullName?: string
  type?: string
  currency?: string
  amount?: number | string
  usdValue?: number | string
  description?: string
  transactionHash?: string
  date?: string
}

const fmt = (v?: number | string) => {
  const n = typeof v === 'string' ? Number(v) : v
  if (n === undefined || n === null || Number.isNaN(n)) return '0.00'
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const Email = ({
  fullName,
  type = 'deposit',
  currency = 'USD',
  amount,
  usdValue,
  description,
  transactionHash,
  date,
}: Props) => {
  const isDeposit = type === 'deposit'
  const label = isDeposit ? 'Depósito' : 'Retiro'
  const accent = isDeposit ? '#047857' : '#b45309'

  return (
    <Html lang="es" dir="ltr">
      <Head />
      <Preview>Movimiento registrado en tu cuenta bancaria</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={brand}>QUANTUM LEDGER BUSINESS BANK</Heading>
          <Text style={greeting}>Hola {fullName || 'Cliente'},</Text>
          <Text style={message}>
            {isDeposit
              ? 'Hemos registrado un depósito en tu cuenta. Los fondos ya están disponibles.'
              : 'Tu retiro ha sido procesado exitosamente.'}
          </Text>

          <Section style={{ ...amountBox, borderColor: accent }}>
            <Text style={amountLabel}>{label}</Text>
            <Text style={{ ...amountValue, color: accent }}>
              {isDeposit ? '+' : '-'}
              {fmt(amount)} {currency.toUpperCase()}
            </Text>
            {usdValue ? <Text style={amountSub}>≈ ${fmt(usdValue)} USD</Text> : null}
          </Section>

          <Hr style={hr} />
          <Text style={row}>Tipo: {label}</Text>
          <Text style={row}>Moneda: {currency.toUpperCase()}</Text>
          {date ? <Text style={row}>Fecha: {date}</Text> : null}
          <Text style={row}>Estado: Completado</Text>
          {description ? <Text style={row}>Descripción: {description}</Text> : null}
          {transactionHash ? <Text style={row}>Referencia: {transactionHash}</Text> : null}
          <Hr style={hr} />

          <Text style={footer}>
            Si no reconoces este movimiento, contacta de inmediato con soporte.
          </Text>
          <Text style={footer}>
            © {new Date().getFullYear()} Quantum Ledger Business Bank · Member FDIC
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: Email,
  subject: (data: Record<string, any>) =>
    `${data.type === 'withdrawal' ? 'Retiro' : 'Depósito'} registrado en tu cuenta - Quantum Ledger Business Bank`,
  displayName: 'Notificación de movimiento',
  previewData: {
    fullName: 'Ana',
    type: 'deposit',
    currency: 'USD',
    amount: 20000,
    usdValue: 20000,
    date: '09/09/2026',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, Helvetica, sans-serif' }
const container = {
  maxWidth: '520px',
  margin: '0 auto',
  padding: '32px 28px',
  border: '1px solid #e2e8f0',
  borderRadius: '12px',
}
const brand = { color: '#1d4ed8', fontSize: '22px', margin: '0 0 24px', textAlign: 'center' as const }
const greeting = { color: '#0f172a', fontSize: '17px', margin: '0 0 12px' }
const message = { color: '#475569', fontSize: '15px', lineHeight: '1.6', margin: '0 0 20px' }
const amountBox = {
  border: '2px solid #047857',
  borderRadius: '10px',
  padding: '20px',
  textAlign: 'center' as const,
}
const amountLabel = { color: '#64748b', fontSize: '12px', margin: '0 0 6px', textTransform: 'uppercase' as const }
const amountValue = { fontSize: '28px', fontWeight: 'bold' as const, margin: '0' }
const amountSub = { color: '#64748b', fontSize: '13px', margin: '8px 0 0' }
const hr = { borderColor: '#e2e8f0', margin: '20px 0' }
const row = { color: '#334155', fontSize: '14px', margin: '4px 0' }
const footer = { color: '#94a3b8', fontSize: '12px', textAlign: 'center' as const, margin: '4px 0' }
