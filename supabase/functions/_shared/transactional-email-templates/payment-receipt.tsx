/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Body, Container, Head, Heading, Html, Preview, Text, Button, Hr, Section } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  companyName?: string
  clientName?: string
  invoiceNumber?: string
  amount?: string
  paymentDate?: string
  receiptUrl?: string
  invoiceUrl?: string
}

const PaymentReceiptEmail = ({
  companyName = 'Our Company',
  clientName = 'there',
  invoiceNumber = '',
  amount = '',
  paymentDate = '',
  receiptUrl = '',
  invoiceUrl = 'https://quicklinq.app',
}: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Payment received{amount ? ` — ${amount}` : ''} for invoice {invoiceNumber}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={headerBar}>
          <Text style={brand}>{companyName}</Text>
        </Section>

        <Heading style={h1}>Payment received</Heading>

        <Text style={text}>
          Hi {clientName},
        </Text>
        <Text style={text}>
          We've received your payment{amount ? <> of <strong>{amount}</strong></> : ''} towards{' '}
          <strong>Invoice {invoiceNumber}</strong>{paymentDate ? <> on {paymentDate}</> : ''}. Your invoice is now
          paid in full — thank you!
        </Text>

        <Section style={amountBox}>
          <Text style={amountLabel}>Amount paid</Text>
          <Text style={amountValue}>{amount || '—'}</Text>
        </Section>

        {receiptUrl ? (
          <Button style={buttonPrimary} href={receiptUrl}>Download receipt (PDF)</Button>
        ) : null}
        <Button style={buttonSecondary} href={invoiceUrl}>View invoice online</Button>

        <Hr style={hr} />
        <Text style={footer}>
          This receipt was sent by {companyName}. Keep it for your records.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: PaymentReceiptEmail,
  subject: (d: Record<string, any>) =>
    `Payment received — Invoice ${d.invoiceNumber || ''}${d.amount ? ` (${d.amount})` : ''}`.trim(),
  displayName: 'Payment receipt (to client)',
  previewData: {
    companyName: 'Acme Contracting',
    clientName: 'Jane',
    invoiceNumber: 'INV-2231',
    amount: '$3,496.50',
    paymentDate: 'May 4, 2026',
    receiptUrl: 'https://quicklinq.app',
    invoiceUrl: 'https://quicklinq.app/pay/123',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Poppins', Arial, sans-serif" }
const container = { padding: '0 0 30px', maxWidth: '560px', margin: '0 auto' }
const headerBar = { backgroundColor: 'hsl(192, 60%, 22%)', padding: '20px 28px', borderRadius: '0' }
const brand = { color: '#ffffff', fontSize: '18px', fontWeight: 'bold' as const, margin: 0 }
const h1 = { fontSize: '24px', fontWeight: 'bold' as const, color: '#1a2e35', margin: '28px 28px 16px' }
const text = { fontSize: '15px', color: '#3a4a52', lineHeight: '1.6', margin: '0 28px 16px' }
const amountBox = { backgroundColor: '#f1f6f6', borderRadius: '10px', padding: '16px 20px', margin: '8px 28px 24px' }
const amountLabel = { fontSize: '12px', color: '#8a9ba3', margin: '0 0 4px', textTransform: 'uppercase' as const, letterSpacing: '0.5px' }
const amountValue = { fontSize: '26px', fontWeight: 'bold' as const, color: 'hsl(170, 50%, 35%)', margin: 0 }
const buttonPrimary = { backgroundColor: 'hsl(170, 50%, 40%)', color: '#ffffff', padding: '13px 28px', borderRadius: '8px', fontWeight: 'bold' as const, fontSize: '15px', textDecoration: 'none', display: 'block' as const, textAlign: 'center' as const, margin: '0 28px 12px' }
const buttonSecondary = { backgroundColor: '#ffffff', color: 'hsl(192, 60%, 22%)', padding: '12px 28px', borderRadius: '8px', fontWeight: 'bold' as const, fontSize: '15px', textDecoration: 'none', display: 'block' as const, textAlign: 'center' as const, border: '1.5px solid hsl(192, 60%, 22%)', margin: '0 28px 8px' }
const hr = { borderColor: '#e5e7eb', margin: '28px 28px 16px' }
const footer = { fontSize: '12px', color: '#8a9ba3', margin: '0 28px', lineHeight: '1.5' }
