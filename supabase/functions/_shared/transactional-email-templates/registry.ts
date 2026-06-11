/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'

export interface TemplateEntry {
  component: React.ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  to?: string
  displayName?: string
  previewData?: Record<string, any>
}

import { template as documentEmail } from './document-email.tsx'
import { template as welcomeEmail } from './welcome-email.tsx'
import { template as lowRatingAlert } from './low-rating-alert.tsx'
import { template as reviewRequest } from './review-request.tsx'
import { template as onboardingDay2 } from './onboarding-day-2.tsx'
import { template as onboardingDay7 } from './onboarding-day-7.tsx'
import { template as quoteViewed } from './quote-viewed.tsx'
import { template as quoteApproved } from './quote-approved.tsx'
import { template as invoiceViewed } from './invoice-viewed.tsx'
import { template as paymentReceived } from './payment-received.tsx'
import { template as paymentReceipt } from './payment-receipt.tsx'
import { template as invoiceReminder } from './invoice-reminder.tsx'
import { template as quoteReminder } from './quote-reminder.tsx'

export const TEMPLATES: Record<string, TemplateEntry> = {
  'document-email': documentEmail,
  'welcome-email': welcomeEmail,
  'low-rating-alert': lowRatingAlert,
  'review-request': reviewRequest,
  'onboarding-day-2': onboardingDay2,
  'onboarding-day-7': onboardingDay7,
  'quote-viewed': quoteViewed,
  'quote-approved': quoteApproved,
  'invoice-viewed': invoiceViewed,
  'payment-received': paymentReceived,
  'payment-receipt': paymentReceipt,
  'invoice-reminder': invoiceReminder,
  'quote-reminder': quoteReminder,
}
