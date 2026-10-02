import type { ComponentType } from 'npm:react@18.3.1'
import { template as otpCodeTemplate } from './otp-code.tsx'
import { template as bankAccountStatusTemplate } from './bank-account-status.tsx'
import { template as transactionNotificationTemplate } from './transaction-notification.tsx'
import { template as verificationStatusTemplate } from './verification-status.tsx'
import { template as transferRequestStatusTemplate } from './transfer-request-status.tsx'

export interface TemplateEntry {
  component: ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  displayName?: string
  previewData?: Record<string, any>
  /** Fixed recipient — overrides caller-provided recipientEmail when set. */
  to?: string
}

/**
 * Template registry — maps template names to their React Email components.
 */
export const TEMPLATES: Record<string, TemplateEntry> = {
  'otp-code': otpCodeTemplate,
  'bank-account-status': bankAccountStatusTemplate,
  'transaction-notification': transactionNotificationTemplate,
  'verification-status': verificationStatusTemplate,
  'transfer-request-status': transferRequestStatusTemplate,
}
