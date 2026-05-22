/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
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

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
  token?: string
}

export const SignupEmail = ({
  siteName,
  siteUrl,
  recipient,
  confirmationUrl,
  token,
}: SignupEmailProps) => {
  const code = token || '00000000'
  const formatted = code.length === 8
    ? `${code.slice(0, 4)} ${code.slice(4)}`
    : code.length === 6
      ? `${code.slice(0, 3)} ${code.slice(3)}`
      : code
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>Your {siteName} verification code: {code}</Preview>
      <Body style={main}>
        <Container style={container}>
          <div style={logoBadge}><Img src={LOGO_URL} alt="QuickLinq" width="28" height="28" style={logoImg} /></div>
          <Heading style={h1}>Welcome to {siteName}!</Heading>
          <Text style={tagline}>Send Quotes. Win Jobs. Get Paid.</Text>
          <Text style={text}>
            Thanks for signing up ({recipient}). Enter this verification code in {siteName} to confirm your email address:
          </Text>
          <div style={codeBox}>{formatted}</div>
          <Text style={expiry}>This code expires in 1 hour.</Text>
          <Text style={fallbackText}>
            Prefer one-tap? <Link href={confirmationUrl} style={link}>Click here to verify instead</Link>.
          </Text>
          <Text style={footer}>
            If you didn't create an account, you can safely ignore this email.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export default SignupEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Poppins', Arial, sans-serif" }
const container = { padding: '20px 25px' }
const logoBadge = { width: '48px', height: '48px', borderRadius: '12px', backgroundColor: 'hsl(195, 55%, 10%)', display: 'flex' as const, alignItems: 'center' as const, justifyContent: 'center' as const, margin: '0 0 16px' }
const logoImg = { margin: '0', display: 'block' as const }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: 'hsl(200, 30%, 14%)', margin: '0 0 4px' }
const tagline = { fontSize: '11px', color: 'hsl(170, 50%, 40%)', letterSpacing: '0.5px', margin: '0 0 20px', fontWeight: 500 as const }
const text = { fontSize: '14px', color: '#55575d', lineHeight: '1.5', margin: '0 0 18px' }
const codeBox = { fontSize: '34px', fontWeight: 'bold' as const, color: 'hsl(192, 60%, 22%)', letterSpacing: '8px', textAlign: 'center' as const, backgroundColor: 'hsl(40, 30%, 96%)', padding: '18px 12px', borderRadius: '10px', margin: '0 0 12px', fontFamily: "'Courier New', monospace" }
const expiry = { fontSize: '12px', color: '#888', textAlign: 'center' as const, margin: '0 0 24px' }
const fallbackText = { fontSize: '13px', color: '#55575d', lineHeight: '1.5', margin: '0 0 16px' }
const link = { color: 'hsl(192, 60%, 22%)', textDecoration: 'underline' }
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0' }
