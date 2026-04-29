/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Button, Hr, Section,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "QuickLinq"

interface ReviewRequestProps {
  clientName?: string
  companyName?: string
  reviewUrl?: string
  isReminder?: boolean
}

const ReviewRequestEmail = ({
  clientName,
  companyName = 'us',
  reviewUrl = 'https://quicklinq.ca',
  isReminder = false,
}: ReviewRequestProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>{isReminder ? 'Quick reminder — ' : ''}How was your experience with {companyName}?</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>
          {clientName ? `Hi ${clientName},` : 'Hi there,'}
        </Heading>
        <Text style={text}>
          {isReminder
            ? `Just a quick reminder — we'd love to hear how things went with ${companyName}.`
            : `Thanks for choosing ${companyName}! We'd love to hear about your experience.`}
        </Text>
        <Text style={text}>
          It only takes 30 seconds — just tap a star.
        </Text>
        <Section style={{ textAlign: 'center', margin: '28px 0' }}>
          <Button style={button} href={reviewUrl}>
            Rate Your Experience ⭐
          </Button>
        </Section>
        <Hr style={hr} />
        <Text style={footer}>
          Your feedback helps us improve — and helps other customers find us.
        </Text>
        <Text style={footer}>— {companyName}</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: ReviewRequestEmail,
  subject: (data: Record<string, any>) =>
    data.isReminder
      ? `Reminder: How was your experience with ${data.companyName ?? 'us'}?`
      : `How was your experience with ${data.companyName ?? 'us'}?`,
  displayName: 'Review request',
  previewData: {
    clientName: 'Jane',
    companyName: 'Acme Landscaping',
    reviewUrl: 'https://quicklinq.ca/review/abc123',
    isReminder: false,
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Poppins', Arial, sans-serif" }
const container = { padding: '30px 25px', maxWidth: '560px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#1a2e35', margin: '0 0 16px', fontFamily: "'Space Grotesk', Arial, sans-serif" }
const text = { fontSize: '15px', color: '#3a4a52', lineHeight: '1.6', margin: '0 0 16px' }
const hr = { borderColor: '#e5e7eb', margin: '24px 0' }
const button = {
  backgroundColor: 'hsl(36, 80%, 50%)',
  color: '#ffffff',
  padding: '14px 32px',
  borderRadius: '8px',
  fontWeight: 'bold' as const,
  fontSize: '15px',
  textDecoration: 'none',
  display: 'inline-block' as const,
}
const footer = { fontSize: '13px', color: '#8a9ba3', margin: '12px 0 0', lineHeight: '1.5' }
