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

const OnboardingDay2 = ({ firstName }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Send your first quote in 60 seconds with Linq AI</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoSection}>
          <Img src={LOGO_URL} width="40" height="40" alt="QuickLinq" style={{ display: 'block', margin: '0 auto' }} />
        </Section>
        <Heading style={h1}>{firstName ? `Hey ${firstName},` : 'Hey there,'} ready to send your first quote?</Heading>
        <Text style={text}>
          Most contractors waste 20+ minutes typing out a quote. With <strong>Linq AI</strong>, you can do it in one sentence.
        </Text>
        <Text style={text}>
          Just tap the <strong>"Ask Linq"</strong> button (bottom right of any screen) and say something like:
        </Text>
        <Text style={quote}>
          "Quote Mark Henderson 8500 for a bathroom reno"
        </Text>
        <Text style={text}>
          Linq creates the client, picks the right service from your catalog, writes the description, applies your tax rate, and drafts the quote — ready for you to review and send.
        </Text>
        <Hr style={hr} />
        <Button style={button} href="https://quicklinq.ca/quotes/new">
          Try Linq AI now
        </Button>
        <Text style={footer}>
          Reply to this email if you get stuck — a real human will help.
        </Text>
        <Text style={footer}>— The {SITE_NAME} Team</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: OnboardingDay2,
  subject: 'Send your first quote in 60 seconds 🚀',
  displayName: 'Onboarding — Day 2',
  previewData: { firstName: 'Sam' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Poppins', Arial, sans-serif" }
const container = { padding: '30px 25px' }
const logoSection = { textAlign: 'center' as const, marginBottom: '20px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#1a2e35', margin: '0 0 20px', lineHeight: '1.3' }
const text = { fontSize: '15px', color: '#3a4a52', lineHeight: '1.6', margin: '0 0 16px' }
const quote = { fontSize: '15px', color: '#1a2e35', lineHeight: '1.6', margin: '0 0 16px', padding: '12px 16px', backgroundColor: '#f3f6f7', borderLeft: '3px solid hsl(170, 50%, 55%)', fontStyle: 'italic' as const }
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
