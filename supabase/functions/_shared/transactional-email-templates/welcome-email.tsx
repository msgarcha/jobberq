/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Button, Hr, Img, Section,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "QuickLinq"

interface WelcomeEmailProps {
  companyName?: string
}

const WelcomeEmail = ({ companyName }: WelcomeEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Welcome to {SITE_NAME} — let's get you paid faster</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoSection}>
          <Img
            src="https://bfnlvdbswhjlpzdfwznz.supabase.co/storage/v1/object/public/email-assets/quicklinq-logo-dark.png"
            width="40"
            height="40"
            alt="QuickLinq"
            style={{ display: 'block', margin: '0 auto' }}
          />
        </Section>
        <Heading style={h1}>
          Welcome to {SITE_NAME}! 🎉
        </Heading>
        <Text style={text}>
          {companyName
            ? `Great to have ${companyName} on board.`
            : "Great to have you on board."
          } You're all set to start sending professional quotes, winning jobs, and getting paid faster.
        </Text>
        <Text style={text}>Here's what you can do next:</Text>
        <Text style={listItem}>✅ <strong>Add your first client</strong> — build your client list</Text>
        <Text style={listItem}>✅ <strong>Create a quote</strong> — win more jobs with polished proposals</Text>
        <Text style={listItem}>✅ <strong>Send an invoice</strong> — get paid on time, every time</Text>
        <Hr style={hr} />
        <Button style={button} href="https://quicklinq.ca">
          Go to Dashboard
        </Button>
        <Text style={footer}>
          Questions? Just reply to this email — we're here to help.
        </Text>
        <Text style={footer}>
          — The {SITE_NAME} Team
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: WelcomeEmail,
  subject: 'Welcome to QuickLinq — let\'s get you paid faster',
  displayName: 'Welcome email',
  previewData: { companyName: 'Acme Landscaping' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Poppins', Arial, sans-serif" }
const container = { padding: '30px 25px' }
const logoSection = { textAlign: 'center' as const, marginBottom: '20px' }
const h1 = { fontSize: '24px', fontWeight: 'bold' as const, color: '#1a2e35', margin: '0 0 20px', fontFamily: "'Space Grotesk', Arial, sans-serif" }
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
