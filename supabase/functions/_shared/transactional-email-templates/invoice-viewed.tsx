/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Body, Container, Head, Heading, Html, Preview, Text, Button, Hr } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  clientName?: string
  invoiceNumber?: string
  amount?: string
  invoiceUrl?: string
}

const InvoiceViewedEmail = ({ clientName = 'Your client', invoiceNumber = '', amount, invoiceUrl = 'https://quicklinq.app' }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>{clientName} just opened invoice {invoiceNumber}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>👀 {clientName} opened your invoice</Heading>
        <Text style={text}>
          <strong>{clientName}</strong> just viewed invoice <strong>{invoiceNumber}</strong>{amount ? <> for <strong>{amount}</strong></> : null}. Payment is likely on the way.
        </Text>
        <Button style={button} href={invoiceUrl}>View Invoice</Button>
        <Hr style={hr} />
        <Text style={footer}>You're getting this because invoice-view alerts are on. Manage in Settings.</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: InvoiceViewedEmail,
  subject: (d: Record<string, any>) => `${d.clientName || 'Your client'} just opened invoice ${d.invoiceNumber || ''}`.trim(),
  displayName: 'Invoice viewed',
  previewData: { clientName: 'Acme Co.', invoiceNumber: 'INV-2231', amount: '$1,450.00', invoiceUrl: 'https://quicklinq.app' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Poppins', Arial, sans-serif" }
const container = { padding: '30px 25px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#1a2e35', margin: '0 0 16px' }
const text = { fontSize: '15px', color: '#3a4a52', lineHeight: '1.6', margin: '0 0 20px' }
const button = { backgroundColor: 'hsl(170, 50%, 40%)', color: '#ffffff', padding: '12px 28px', borderRadius: '8px', fontWeight: 'bold' as const, fontSize: '15px', textDecoration: 'none', display: 'inline-block' as const }
const hr = { borderColor: '#e5e7eb', margin: '28px 0 16px' }
const footer = { fontSize: '12px', color: '#8a9ba3', margin: 0, lineHeight: '1.5' }
