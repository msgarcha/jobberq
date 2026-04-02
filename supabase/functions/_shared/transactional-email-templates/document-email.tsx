import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Img, Preview, Text, Button, Hr, Section,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "QuickLinq"
const LOGO_URL = 'https://bfnlvdbswhjlpzdfwznz.supabase.co/storage/v1/object/public/email-assets/quicklinq-logo-white.png'

interface DocumentEmailProps {
  companyName?: string
  clientName?: string
  body?: string
  ctaUrl?: string
  ctaLabel?: string
  documentType?: string
  documentNumber?: string
}

const DocumentEmail = ({
  companyName = "Our Company",
  clientName = "there",
  body = "",
  ctaUrl = "#",
  ctaLabel = "View Document",
  documentType = "Invoice",
  documentNumber = "",
}: DocumentEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>{`${documentType} ${documentNumber} from ${companyName}`}</Preview>
    <Body style={main}>
      <Container style={container}>
        {/* Logo + Company header */}
        <Section style={headerSection}>
          <Img src={LOGO_URL} alt="QuickLinq" width="40" height="40" style={logo} />
          <Text style={companyNameStyle}>{companyName}</Text>
        </Section>

        <Hr style={divider} />

        {/* Body text — preserves line breaks */}
        <Section style={bodySection}>
          {body.split('\n').map((line, i) => (
            <Text key={i} style={bodyText}>
              {line || '\u00A0'}
            </Text>
          ))}
        </Section>

        {/* CTA button */}
        <Section style={ctaSection}>
          <Button href={ctaUrl} style={ctaButton}>
            {ctaLabel}
          </Button>
        </Section>

        <Hr style={divider} />

        {/* Footer */}
        <Text style={footer}>
          Sent via {SITE_NAME} on behalf of {companyName}
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: DocumentEmail,
  subject: (data: Record<string, any>) =>
    data.subject || `${data.documentType || 'Document'} from ${data.companyName || 'Us'}`,
  displayName: 'Document email (invoice/quote)',
  previewData: {
    companyName: 'Acme Contracting',
    clientName: 'John',
    body: 'Hi John,\n\nPlease find attached your invoice INV-001. The balance due is $1,500.00, due by Apr 15, 2026.\n\nYou can view and pay this invoice online using the link below.\n\nThank you for your business!\n\nAcme Contracting',
    ctaUrl: 'https://example.com/pay/123',
    ctaLabel: 'View Invoice',
    documentType: 'Invoice',
    documentNumber: 'INV-001',
    subject: 'Invoice from Acme Contracting — INV-001',
  },
} satisfies TemplateEntry

// Styles
const main = { backgroundColor: '#ffffff', fontFamily: "'Poppins', Arial, sans-serif" }
const container = { padding: '30px 25px', maxWidth: '560px', margin: '0 auto' }
const headerSection = { paddingBottom: '8px' }
const logo = { margin: '0 0 8px' }
const companyNameStyle = { fontSize: '18px', fontWeight: '700' as const, color: '#1a3a3a', margin: '0' }
const divider = { borderColor: '#e8e5e0', margin: '16px 0' }
const bodySection = { padding: '8px 0' }
const bodyText = { fontSize: '14px', color: '#333333', lineHeight: '1.6', margin: '0', padding: '0' }
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
