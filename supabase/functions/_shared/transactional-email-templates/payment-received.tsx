/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Body, Container, Head, Heading, Html, Preview, Text, Button, Hr } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  kind?: 'deposit' | 'full'
  clientName?: string
  invoiceNumber?: string
  amount?: string
  invoiceUrl?: string
}

const PaymentReceivedEmail = ({ kind = 'full', clientName = 'Your client', invoiceNumber = '', amount, invoiceUrl = 'https://quicklinq.app' }: Props) => {
  const isDeposit = kind === 'deposit'
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>{isDeposit ? 'Deposit received' : 'Invoice paid in full'} {amount ? `— ${amount}` : ''}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>💰 {isDeposit ? 'Deposit received' : 'Invoice paid in full'}</Heading>
          <Text style={text}>
            <strong>{clientName}</strong> just paid {amount ? <strong>{amount}</strong> : 'a payment'} on invoice <strong>{invoiceNumber}</strong>.
            {isDeposit ? ' This was a partial deposit — balance is still outstanding.' : ' The invoice is fully paid. Nice work!'}
          </Text>
          <Button style={button} href={invoiceUrl}>Open Invoice</Button>
          <Hr style={hr} />
          <Text style={footer}>You're getting this because payment alerts are on. Manage in Settings.</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: PaymentReceivedEmail,
  subject: (d: Record<string, any>) => `${d.kind === 'deposit' ? '💰 Deposit received' : '✅ Invoice paid'} — ${d.invoiceNumber || ''}${d.amount ? ` (${d.amount})` : ''}`.trim(),
  displayName: 'Payment received',
  previewData: { kind: 'full', clientName: 'Acme Co.', invoiceNumber: 'INV-2231', amount: '$1,450.00', invoiceUrl: 'https://quicklinq.app' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Poppins', Arial, sans-serif" }
const container = { padding: '30px 25px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#1a2e35', margin: '0 0 16px' }
const text = { fontSize: '15px', color: '#3a4a52', lineHeight: '1.6', margin: '0 0 20px' }
const button = { backgroundColor: 'hsl(170, 50%, 40%)', color: '#ffffff', padding: '12px 28px', borderRadius: '8px', fontWeight: 'bold' as const, fontSize: '15px', textDecoration: 'none', display: 'inline-block' as const }
const hr = { borderColor: '#e5e7eb', margin: '28px 0 16px' }
const footer = { fontSize: '12px', color: '#8a9ba3', margin: 0, lineHeight: '1.5' }
