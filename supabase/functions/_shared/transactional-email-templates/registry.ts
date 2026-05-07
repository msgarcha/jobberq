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

export const TEMPLATES: Record<string, TemplateEntry> = {
  'document-email': documentEmail,
  'welcome-email': welcomeEmail,
  'low-rating-alert': lowRatingAlert,
  'review-request': reviewRequest,
  'onboarding-day-2': onboardingDay2,
  'onboarding-day-7': onboardingDay7,
}
