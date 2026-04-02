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

export const TEMPLATES: Record<string, TemplateEntry> = {
  'document-email': documentEmail,
  'welcome-email': welcomeEmail,
}
