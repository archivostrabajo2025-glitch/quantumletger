import * as React from 'npm:react@18.3.1'
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  fullName?: string
  status?: 'approved' | 'rejected'
  bankName?: string
  accountNumber?: string
  amount?: number | string
  currency?: string
}

const maskAccount = (value?: string) => {
  if (!value) return ''
  const clean = String(value)
  return clean.length > 4 ? `•••• ${clean.slice(-4)}` : clean
}

const Email = ({ fullName, status = 'approved', bankName, accountNumber, amount, currency = 'USD' }: Props) => {
  const approved = status === 'approved'
  const accent = approved ? '#047857' : '#b91c1c'
  return (
    <Html lang="es" dir="ltr">
      <Head />
      <Preview>Resultado de tu solicitud de transferencia</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={brand}>QUANTUM LEDGER BUSINESS BANK</Heading>
          <Text style={greeting}>Hola {fullName || 'Cliente'},</Text>
          <Section style={{ ...box, borderColor: accent }}>
            <Text style={{ ...title, color: accent }}>
              {approved ? 'Solicitud de transferencia aprobada' : 'Solicitud de transferencia rechazada'}
            </Text>
          </Section>
          {amount !== undefined && amount !== null && String(amount) !== '' ? (
            <Text style={detail}>
              Monto: <strong>{`${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`}</strong>
            </Text>
          ) : null}
          {bankName ? (
            <Text style={detail}>
              Banco destino: <strong>{bankName}</strong>
            </Text>
          ) : null}
          {accountNumber ? (
            <Text style={detail}>
              Cuenta: <strong>{maskAccount(accountNumber)}</strong>
            </Text>
          ) : null}
          <Text style={message}>
            {approved
              ? 'Tu solicitud de transferencia fue revisada y aprobada. El envío de fondos será procesado hacia la cuenta indicada.'
              : 'Tu solicitud de transferencia no fue aprobada. Revisa los datos de la cuenta destino y vuelve a enviarla desde tu panel.'}
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
    data.status === 'rejected'
      ? 'Solicitud de transferencia rechazada - Quantum Ledger Business Bank'
      : 'Solicitud de transferencia aprobada - Quantum Ledger Business Bank',
  displayName: 'Resultado de solicitud de transferencia',
  previewData: {
    fullName: 'Ana',
    status: 'approved',
    bankName: 'Banco Nacional',
    accountNumber: '12345678',
    amount: 1500,
    currency: 'USD',
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
const box = { border: '2px solid #047857', borderRadius: '10px', padding: '18px', textAlign: 'center' as const }
const title = { fontSize: '20px', fontWeight: 'bold' as const, margin: '0' }
const detail = { color: '#0f172a', fontSize: '15px', margin: '14px 0 0' }
const message = { color: '#475569', fontSize: '15px', lineHeight: '1.6', margin: '18px 0 0' }
const footer = { color: '#94a3b8', fontSize: '12px', margin: '28px 0 0', textAlign: 'center' as const }
