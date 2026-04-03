/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

const LOGO_URL = 'https://bfnlvdbswhjlpzdfwznz.supabase.co/storage/v1/object/public/email-assets/quicklinq-icon.png'

interface InviteEmailProps {
  siteName: string
  siteUrl: string
  confirmationUrl: string
}

export const InviteEmail = ({
  siteName,
  siteUrl,
  confirmationUrl,
}: InviteEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>You've been invited to join {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <div style={logoBadge}><Img src={LOGO_URL} alt="QuickLinq" width="28" height="28" style={logoImg} /></div>
        <Heading style={h1}>You've been invited</Heading>
        <Text style={tagline}>Send Quotes. Win Jobs. Get Paid.</Text>
        <Text style={text}>
          You've been invited to join{' '}
          <Link href={siteUrl} style={link}>
            <strong>{siteName}</strong>
          </Link>
          . Click the button below to accept the invitation and create your
          account.
        </Text>
        <Button style={button} href={confirmationUrl}>
          Accept Invitation
        </Button>
        <Text style={footer}>
          If you weren't expecting this invitation, you can safely ignore this
          email.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default InviteEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Poppins', Arial, sans-serif" }
const container = { padding: '20px 25px' }
const logoBadge = { width: '48px', height: '48px', borderRadius: '12px', backgroundColor: 'hsl(195, 55%, 10%)', display: 'flex' as const, alignItems: 'center' as const, justifyContent: 'center' as const, margin: '0 0 16px' }
const logoImg = { margin: '0', display: 'block' as const }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: 'hsl(200, 30%, 14%)', margin: '0 0 4px' }
const tagline = { fontSize: '11px', color: 'hsl(170, 50%, 40%)', letterSpacing: '0.5px', margin: '0 0 20px', fontWeight: 500 as const }
const text = { fontSize: '14px', color: '#55575d', lineHeight: '1.5', margin: '0 0 25px' }
const link = { color: 'inherit', textDecoration: 'underline' }
const button = { backgroundColor: 'hsl(192, 60%, 22%)', color: '#ffffff', fontSize: '14px', borderRadius: '0.5rem', padding: '12px 20px', textDecoration: 'none' }
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0' }
