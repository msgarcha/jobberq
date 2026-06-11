import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Img, Preview, Text, Button, Hr, Section,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "QuickLinq"
const LOGO_URL = 'https://bfnlvdbswhjlpzdfwznz.supabase.co/storage/v1/object/public/email-assets/quicklinq-icon.png'

interface QuoteReminderProps {
  companyName?: string
  clientName?: string
  documentNumber?: string
  amount?: string
  validUntil?: string
  ctaUrl?: string
}

const QuoteReminder = ({
  companyName = "Our Company",
  clientName = "there",
  documentNumber = "",
  amount = "",
  validUntil = "",
  ctaUrl = "#",
}: QuoteReminderProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>{`Reminder: your estimate ${documentNumber} from ${companyName} is waiting`}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={headerSection}>
          <div style={logoBadge}><Img src={LOGO_URL} alt="QuickLinq" width="24" height="24" style={logoImgStyle} /></div>
          <Text style={companyNameStyle}>{companyName}</Text>
        </Section>

        <Hr style={divider} />

        <Heading style={heading}>Still interested?</Heading>

        <Section style={bodySection}>
          <Text style={bodyText}>Hi {clientName},</Text>
          <Text style={bodyText}>
            We wanted to follow up on estimate <strong>{documentNumber}</strong>
            {amount ? <> for <strong>{amount}</strong></> : null}.
            {validUntil ? <> It’s valid until <strong>{validUntil}</strong>.</> : null}
          </Text>
          <Text style={bodyText}>
            You can review and approve it online whenever you’re ready.
          </Text>
        </Section>

        <Section style={ctaSection}>
          <Button href={ctaUrl} style={ctaButton}>
            View &amp; Approve Estimate
          </Button>
        </Section>

        <Hr style={divider} />

        <Text style={footer}>
          Sent via {SITE_NAME} on behalf of {companyName}. If you’ve already responded, please disregard this message.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: QuoteReminder,
  subject: (data: Record<string, any>) =>
    `Reminder: estimate ${data.documentNumber || ''} from ${data.companyName || 'Us'}`.trim(),
  displayName: 'Quote/estimate reminder',
  previewData: {
    companyName: 'Acme Contracting',
    clientName: 'John',
    documentNumber: 'QUO-2001',
    amount: '$3,200.00',
    validUntil: 'Apr 30, 2026',
    ctaUrl: 'https://example.com/quote/view/123',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Poppins', Arial, sans-serif" }
const container = { padding: '30px 25px', maxWidth: '560px', margin: '0 auto' }
const headerSection = { paddingBottom: '8px' }
const logoBadge = { width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'hsl(195, 55%, 10%)', display: 'inline-block' as const, textAlign: 'center' as const, lineHeight: '40px', margin: '0 0 8px' }
const logoImgStyle = { margin: '0', display: 'inline-block' as const, verticalAlign: 'middle' }
const companyNameStyle = { fontSize: '18px', fontWeight: '700' as const, color: '#1a3a3a', margin: '0' }
const divider = { borderColor: '#e8e5e0', margin: '16px 0' }
const heading = { fontSize: '20px', fontWeight: '700' as const, color: '#1a3a3a', margin: '4px 0 8px' }
const bodySection = { padding: '8px 0' }
const bodyText = { fontSize: '14px', color: '#333333', lineHeight: '1.6', margin: '0 0 12px', padding: '0' }
const ctaSection = { textAlign: 'center' as const, padding: '20px 0' }
const ctaButton = {
  backgroundColor: '#1a4a4a',
  color: '#ffffff',
  padding: '14px 32px',
  borderRadius: '8px',
  fontSize: '15px',
  fontWeight: '600' as const,
  textDecoration: 'none',
  display: 'inline-block',
}
const footer = { fontSize: '11px', color: '#999999', textAlign: 'center' as const, margin: '16px 0 0' }
