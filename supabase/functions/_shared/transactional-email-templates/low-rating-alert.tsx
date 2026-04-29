/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Button, Hr, Section,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "QuickLinq"

interface LowRatingAlertProps {
  clientName?: string
  rating?: number
  feedback?: string
  dashboardUrl?: string
}

const LowRatingAlertEmail = ({
  clientName = 'A client',
  rating = 2,
  feedback,
  dashboardUrl = 'https://quicklinq.ca/reviews',
}: LowRatingAlertProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>⚠️ {clientName} left a {rating}-star review — respond before it goes public</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={alertBanner}>
          <Text style={alertText}>⚠️ Reputation Shield Alert</Text>
        </Section>
        <Heading style={h1}>
          {clientName} left a {rating}-star rating
        </Heading>
        <Text style={text}>
          Their feedback was kept private (not sent to Google). This is your chance to follow up
          and make it right <strong>before</strong> they leave a public review elsewhere.
        </Text>
        {feedback ? (
          <Section style={feedbackBox}>
            <Text style={feedbackLabel}>Their feedback:</Text>
            <Text style={feedbackText}>"{feedback}"</Text>
          </Section>
        ) : (
          <Text style={text}>They didn't leave written feedback — consider reaching out personally.</Text>
        )}
        <Hr style={hr} />
        <Button style={button} href={dashboardUrl}>
          View in Dashboard
        </Button>
        <Text style={footer}>
          Quick action turns unhappy customers into loyal ones. Pick up the phone today.
        </Text>
        <Text style={footer}>— The {SITE_NAME} Team</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: LowRatingAlertEmail,
  subject: (data: Record<string, any>) =>
    `⚠️ ${data.clientName ?? 'A client'} left a ${data.rating ?? ''}-star rating — act now`,
  displayName: 'Low rating alert (owner)',
  previewData: {
    clientName: 'John Smith',
    rating: 2,
    feedback: 'The crew showed up late and left a mess.',
    dashboardUrl: 'https://quicklinq.ca/reviews',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Poppins', Arial, sans-serif" }
const container = { padding: '30px 25px', maxWidth: '560px' }
const alertBanner = { backgroundColor: '#fef3c7', borderLeft: '4px solid #f59e0b', padding: '10px 14px', marginBottom: '20px', borderRadius: '4px' }
const alertText = { fontSize: '13px', color: '#92400e', margin: '0', fontWeight: 'bold' as const }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#1a2e35', margin: '0 0 16px', fontFamily: "'Space Grotesk', Arial, sans-serif" }
const text = { fontSize: '15px', color: '#3a4a52', lineHeight: '1.6', margin: '0 0 16px' }
const feedbackBox = { backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '14px 18px', margin: '16px 0' }
const feedbackLabel = { fontSize: '12px', color: '#6b7280', margin: '0 0 6px', textTransform: 'uppercase' as const, fontWeight: 'bold' as const, letterSpacing: '0.5px' }
const feedbackText = { fontSize: '15px', color: '#1f2937', lineHeight: '1.5', margin: '0', fontStyle: 'italic' as const }
const hr = { borderColor: '#e5e7eb', margin: '24px 0' }
const button = {
  backgroundColor: 'hsl(192, 60%, 22%)',
  color: '#ffffff',
  padding: '12px 28px',
  borderRadius: '8px',
  fontWeight: 'bold' as const,
  fontSize: '15px',
  textDecoration: 'none',
  display: 'inline-block' as const,
}
const footer = { fontSize: '13px', color: '#8a9ba3', margin: '20px 0 0', lineHeight: '1.5' }
