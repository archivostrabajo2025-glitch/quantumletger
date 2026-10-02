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
  otpCode?: string
  fullName?: string
  type?: 'signup' | 'password_reset' | 'login'
}

const messageFor = (type?: string) =>
  type === 'password_reset'
    ? 'Has solicitado restablecer tu contraseña en Quantum Ledger. Usa el siguiente código para continuar:'
    : type === 'login'
      ? 'Se ha detectado un inicio de sesión en tu cuenta de Quantum Ledger. Usa el siguiente código para verificar tu identidad:'
      : 'Has solicitado verificar tu cuenta en Quantum Ledger. Usa el siguiente código para completar tu registro:'

const Email = ({ otpCode = '000000', fullName, type = 'signup' }: Props) => (
  <Html lang="es" dir="ltr">
    <Head />
    <Preview>Código de seguridad solicitado para tu cuenta bancaria</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={brand}>QUANTUM LEDGER BUSINESS BANK</Heading>
        <Text style={greeting}>Hola {fullName || 'Usuario'},</Text>
        <Text style={message}>{messageFor(type)}</Text>
        <Section style={codeBox}>
          <Text style={code}>{otpCode}</Text>
        </Section>
        <Text style={expiry}>Este código expira en 10 minutos.</Text>
        <Text style={footer}>
          Si no solicitaste este código, ignora este mensaje.
        </Text>
        <Text style={footer}>
          © {new Date().getFullYear()} Quantum Ledger Business Bank
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (data: Record<string, any>) =>
    data.type === 'password_reset'
      ? 'Código de seguridad para restablecer tu contraseña'
      : data.type === 'login'
        ? 'Código de seguridad para iniciar sesión'
        : 'Código de seguridad para verificar tu correo',
  displayName: 'Código de verificación (OTP)',
  previewData: { otpCode: '123456', fullName: 'Ana', type: 'signup' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, Helvetica, sans-serif' }
const container = {
  maxWidth: '500px',
  margin: '0 auto',
  padding: '32px 28px',
  border: '1px solid #e2e8f0',
  borderRadius: '12px',
}
const brand = { color: '#1d4ed8', fontSize: '24px', margin: '0 0 24px', textAlign: 'center' as const }
const greeting = { color: '#0f172a', fontSize: '17px', margin: '0 0 12px' }
const message = { color: '#475569', fontSize: '15px', lineHeight: '1.6', margin: '0 0 24px' }
const codeBox = {
  backgroundColor: '#1d4ed8',
  borderRadius: '10px',
  padding: '24px',
  textAlign: 'center' as const,
}
const code = {
  color: '#ffffff',
  fontSize: '34px',
  fontWeight: 'bold' as const,
  letterSpacing: '8px',
  margin: '0',
}
const expiry = { color: '#64748b', fontSize: '13px', textAlign: 'center' as const, margin: '20px 0' }
const footer = { color: '#94a3b8', fontSize: '12px', textAlign: 'center' as const, margin: '4px 0' }
