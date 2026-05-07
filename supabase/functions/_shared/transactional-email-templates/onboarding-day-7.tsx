/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Button, Hr, Img, Section,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "QuickLinq"
const LOGO_URL = 'https://bfnlvdbswhjlpzdfwznz.supabase.co/storage/v1/object/public/email-assets/quicklinq-logo-dark.png'

interface Props {
  firstName?: string
}

const OnboardingDay7 = ({ firstName }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Get paid 3x faster — connect Stripe in 2 minutes</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoSection}>
          <Img src={LOGO_URL} width="40" height="40" alt="QuickLinq" style={{ display: 'block', margin: '0 auto' }} />
        </Section>
        <Heading style={h1}>{firstName ? `${firstName}, ` : ''}stop chasing payments</Heading>
        <Text style={text}>
          Contractors using <strong>QuickLinq with Stripe Connect</strong> get paid an average of <strong>3x faster</strong> than those who only invoice by email.
        </Text>
        <Text style={text}>Here's why:</Text>
        <Text style={listItem}>💳 <strong>One-tap pay</strong> — clients pay with Apple Pay or card straight from the invoice</Text>
        <Text style={listItem}>🏦 <strong>Auto deposits</strong> — money lands in your bank every 3 days</Text>
        <Text style={listItem}>📊 <strong>Quote deposits</strong> — collect 30% upfront before the job starts</Text>
        <Text style={listItem}>🔒 <strong>Saved cards</strong> — auto-charge repeat clients without lifting a finger</Text>
        <Hr style={hr} />
        <Button style={button} href="https://quicklinq.ca/connect">
          Connect Stripe (2 min)
        </Button>
        <Text style={footer}>
          Already connected? You're set. Just send your next invoice with the "Collect Payment" toggle on.
        </Text>
        <Text style={footer}>— The {SITE_NAME} Team</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: OnboardingDay7,
  subject: 'Get paid 3x faster with one-tap invoices 💳',
  displayName: 'Onboarding — Day 7',
  previewData: { firstName: 'Sam' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Poppins', Arial, sans-serif" }
const container = { padding: '30px 25px' }
const logoSection = { textAlign: 'center' as const, marginBottom: '20px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#1a2e35', margin: '0 0 20px', lineHeight: '1.3' }
const text = { fontSize: '15px', color: '#3a4a52', lineHeight: '1.6', margin: '0 0 16px' }
const listItem = { fontSize: '15px', color: '#3a4a52', lineHeight: '1.6', margin: '0 0 8px', paddingLeft: '4px' }
const hr = { borderColor: '#e5e7eb', margin: '24px 0' }
const button = {
  backgroundColor: 'hsl(170, 50%, 55%)',
  color: '#ffffff',
  padding: '12px 28px',
  borderRadius: '8px',
  fontWeight: 'bold' as const,
  fontSize: '15px',
  textDecoration: 'none',
  display: 'inline-block' as const,
}
const footer = { fontSize: '13px', color: '#8a9ba3', margin: '24px 0 0', lineHeight: '1.5' }
