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
  notes?: string
}

const Email = ({ fullName, status = 'approved', notes }: Props) => {
  const approved = status === 'approved'
  const accent = approved ? '#047857' : '#b91c1c'
  return (
    <Html lang="es" dir="ltr">
      <Head />
      <Preview>Resultado de la revisión de tu cuenta</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={brand}>QUANTUM LEDGER BUSINESS BANK</Heading>
          <Text style={greeting}>Hola {fullName || 'Cliente'},</Text>
          <Section style={{ ...box, borderColor: accent }}>
            <Text style={{ ...title, color: accent }}>
              {approved ? 'Cuenta verificada' : 'Verificación rechazada'}
            </Text>
          </Section>
          <Text style={message}>
            {approved
              ? 'Tu cuenta ha sido verificada exitosamente. Ya tienes acceso completo a tus servicios bancarios.'
              : 'Tu solicitud de verificación no fue aprobada. Puedes volver a enviar tus documentos.'}
          </Text>
          {!approved && notes ? <Text style={message}>Motivo: {notes}</Text> : null}
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
      ? 'Verificación rechazada - Quantum Ledger Business Bank'
      : 'Cuenta verificada - Quantum Ledger Business Bank',
  displayName: 'Resultado de verificación',
  previewData: { fullName: 'Ana', status: 'approved' },
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
const message = { color: '#475569', fontSize: '15px', lineHeight: '1.6', margin: '18px 0 0' }
const footer = { color: '#94a3b8', fontSize: '12px', textAlign: 'center' as const, margin: '20px 0 0' }
