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
}

const maskAccount = (value?: string) => {
  if (!value) return ''
  const clean = String(value)
  return clean.length > 4 ? `•••• ${clean.slice(-4)}` : clean
}

const Email = ({ fullName, status = 'approved', bankName, accountNumber }: Props) => {
  const approved = status === 'approved'
  const accent = approved ? '#047857' : '#b91c1c'
  return (
    <Html lang="es" dir="ltr">
      <Head />
      <Preview>Resultado de la revisión de tu cuenta bancaria afiliada</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={brand}>QUANTUM LEDGER BUSINESS BANK</Heading>
          <Text style={greeting}>Hola {fullName || 'Cliente'},</Text>
          <Section style={{ ...box, borderColor: accent }}>
            <Text style={{ ...title, color: accent }}>
              {approved ? 'Cuenta bancaria aprobada' : 'Cuenta bancaria rechazada'}
            </Text>
          </Section>
          {bankName ? (
            <Text style={detail}>
              Banco: <strong>{bankName}</strong>
            </Text>
          ) : null}
          {accountNumber ? (
            <Text style={detail}>
              Cuenta: <strong>{maskAccount(accountNumber)}</strong>
            </Text>
          ) : null}
          <Text style={message}>
            {approved
              ? 'Tu cuenta bancaria afiliada fue revisada y aprobada. Ya puedes utilizarla para tus operaciones.'
              : 'Tu cuenta bancaria afiliada no fue aprobada. Verifica los datos registrados y vuelve a enviarlos desde tu panel.'}
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
      ? 'Cuenta bancaria rechazada - Quantum Ledger Business Bank'
      : 'Cuenta bancaria aprobada - Quantum Ledger Business Bank',
  displayName: 'Resultado de cuenta bancaria afiliada',
  previewData: { fullName: 'Ana', status: 'approved', bankName: 'Banco Nacional', accountNumber: '12345678' },
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
const footer = { color: '#94a3b8', fontSize: '12px', textAlign: 'center' as const, margin: '20px 0 0' }
