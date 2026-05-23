import LegalLayout from "@/components/legal/LegalLayout";

const LAST_UPDATED = "May 23, 2026";
const VERSION = "2026-05-23";

const sections = [
  { id: "who", title: "Who We Are" },
  { id: "scope", title: "Scope of This Policy" },
  { id: "collect", title: "Information We Collect" },
  { id: "use", title: "How We Use Information" },
  { id: "legal-basis", title: "Legal Bases for Processing" },
  { id: "sharing", title: "Sharing & Sub-Processors" },
  { id: "transfers", title: "International Data Transfers" },
  { id: "retention", title: "Data Retention" },
  { id: "security", title: "Security" },
  { id: "rights", title: "Your Rights" },
  { id: "children", title: "Children" },
  { id: "cookies", title: "Cookies & Similar Technologies" },
  { id: "changes", title: "Changes to This Policy" },
  { id: "contact", title: "Contact & Privacy Officer" },
];

export default function Privacy() {
  return (
    <LegalLayout
      title="Privacy Policy"
      description="How Quiresoft Technologies Inc. collects, uses, and protects personal information through the QuickLinq service."
      path="/privacy"
      lastUpdated={LAST_UPDATED}
      version={VERSION}
      sections={sections}
      intro={
        <>
          <p className="mb-3">
            This Privacy Policy explains how <strong>Quiresoft Technologies Inc.</strong>{" "}
            (<strong>&ldquo;Quiresoft&rdquo;</strong>, <strong>&ldquo;we&rdquo;</strong>,{" "}
            <strong>&ldquo;us&rdquo;</strong>), a corporation registered in British Columbia,
            Canada, collects, uses, discloses, and safeguards personal information through{" "}
            <strong>QuickLinq</strong> (the <strong>&ldquo;Service&rdquo;</strong>), a wholly-owned
            subsidiary product of Quiresoft.
          </p>
          <p>
            We comply with Canada&rsquo;s Personal Information Protection and Electronic Documents
            Act (PIPEDA) and applicable provincial privacy laws, and provide additional rights
            where required by the EU/UK GDPR, the California Consumer Privacy Act (CCPA/CPRA), and
            other applicable laws.
          </p>
        </>
      }
    >
      <h2 id="who">1. Who We Are</h2>
      <p>
        Quiresoft Technologies Inc. is the <strong>controller</strong> (or equivalent under
        applicable law) of personal information processed about our Customers (account holders) in
        connection with their use of the Service. For information that our Customers submit about
        their own End Clients, jobs, quotes, and invoices, Quiresoft acts as a{" "}
        <strong>processor</strong> (or service provider) on the Customer&rsquo;s behalf.
      </p>

      <h2 id="scope">2. Scope of This Policy</h2>
      <p>
        This policy applies to personal information we collect through the QuickLinq website, web
        application, mobile applications, and related services. It does not apply to third-party
        websites or services that we do not operate, including Stripe&rsquo;s payment processing
        services, which are governed by Stripe&rsquo;s own privacy notice.
      </p>

      <h2 id="collect">3. Information We Collect</h2>
      <h3>3.1 Information you provide</h3>
      <ul>
        <li><strong>Account information:</strong> name, email, password (hashed), business name, role, phone number, and profile photo.</li>
        <li><strong>Business and operational data:</strong> company settings, branding, service catalog, team member information, and configuration.</li>
        <li><strong>End-Client and document data:</strong> the names, addresses, contact details, job notes, quotes, invoices, payments, and other information you enter about your End Clients.</li>
        <li><strong>Payment metadata:</strong> Stripe Connect account identifiers, payout status, transaction amounts and timestamps, and the last four digits of cards used by End Clients. <strong>We do not store full card numbers, CVCs, or full bank account numbers;</strong> these are collected and stored by Stripe.</li>
        <li><strong>Communications:</strong> support requests, feedback, and emails you send to us.</li>
      </ul>
      <h3>3.2 Information collected automatically</h3>
      <ul>
        <li><strong>Usage and device data:</strong> IP address, browser and operating-system type, device identifiers, referring URLs, pages viewed, actions taken, timestamps, and crash diagnostics.</li>
        <li><strong>Cookies and similar technologies:</strong> see Section 12.</li>
      </ul>
      <h3>3.3 Information from third parties</h3>
      <ul>
        <li><strong>Stripe:</strong> account onboarding status, capability and verification results, payout and transaction metadata.</li>
        <li><strong>Identity providers:</strong> if you sign in with a third-party identity provider, basic profile information from that provider.</li>
      </ul>

      <h2 id="use">4. How We Use Information</h2>
      <p>We use personal information to:</p>
      <ul>
        <li>provide, operate, secure, and maintain the Service;</li>
        <li>process subscriptions, billing, and platform application fees;</li>
        <li>route payments and payouts through Stripe Connect;</li>
        <li>send service-related communications, including transactional emails (quotes, invoices, receipts, review requests) on your behalf and to you;</li>
        <li>provide customer support and respond to inquiries;</li>
        <li>improve and develop new features, including by analyzing aggregated usage;</li>
        <li>power AI-assisted features (see Section 6 below);</li>
        <li>detect, prevent, and address fraud, security incidents, and abuse; and</li>
        <li>comply with legal obligations and enforce our Terms.</li>
      </ul>

      <h2 id="legal-basis">5. Legal Bases for Processing</h2>
      <p>
        Where the GDPR or similar laws apply, we rely on the following legal bases: (a){" "}
        <strong>performance of a contract</strong> with you to provide the Service; (b){" "}
        <strong>legitimate interests</strong> in operating, securing, and improving the Service,
        provided those interests are not overridden by your rights; (c) <strong>compliance with
        legal obligations</strong>; and (d) your <strong>consent</strong>, where required (for
        example, for certain marketing communications). Under PIPEDA, we rely on your implied or
        express consent as appropriate.
      </p>

      <h2 id="sharing">6. Sharing &amp; Sub-Processors</h2>
      <p>
        We do not sell personal information. We share personal information only as described
        below:
      </p>
      <ul>
        <li>
          <strong>Service providers (sub-processors)</strong> that help us operate the Service
          under written contracts requiring confidentiality and appropriate security:
          <ul>
            <li><strong>Supabase</strong> (database, authentication, storage, edge functions) &mdash; hosted via Lovable Cloud</li>
            <li><strong>Stripe, Inc.</strong> and <strong>Stripe Payments Canada, Ltd.</strong> &mdash; payment processing, payouts, Connect onboarding</li>
            <li><strong>Resend</strong> &mdash; transactional email delivery (notify.quicklinq.ca)</li>
            <li><strong>Google</strong> and <strong>OpenAI</strong>, via the <strong>Lovable AI Gateway</strong> &mdash; AI Features inference</li>
            <li><strong>Cloud hosting and CDN providers</strong> &mdash; infrastructure and content delivery</li>
            <li><strong>Apple</strong> and <strong>Google</strong> &mdash; push notifications for the iOS app</li>
          </ul>
        </li>
        <li><strong>Stripe.</strong> When you or your End Clients use the payment features, payment data is collected and processed directly by Stripe under <a href="https://stripe.com/legal/ssa" target="_blank" rel="noopener noreferrer">Stripe&rsquo;s terms</a> and <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer">Stripe&rsquo;s privacy policy</a>.</li>
        <li><strong>Compliance and safety.</strong> We may disclose information when required by law, subpoena, or court order, or to protect the rights, property, or safety of Quiresoft, our Customers, or others.</li>
        <li><strong>Business transfers.</strong> If Quiresoft is involved in a merger, acquisition, or sale of assets, personal information may be transferred subject to standard confidentiality protections.</li>
        <li><strong>With your consent</strong> or at your direction.</li>
      </ul>

      <h2 id="transfers">7. International Data Transfers</h2>
      <p>
        Quiresoft is based in Canada. Personal information may be processed and stored in Canada,
        the United States, the European Union, and other jurisdictions where our sub-processors
        operate. Where required, we use lawful transfer mechanisms (such as Standard Contractual
        Clauses) to protect personal information transferred across borders.
      </p>

      <h2 id="retention">8. Data Retention</h2>
      <p>
        We retain personal information for as long as your Account is active and for a reasonable
        period afterward to comply with legal obligations, resolve disputes, and enforce our
        agreements. Payment records are retained as required by applicable financial and tax law.
        Customer Data is deleted or anonymized after a reasonable retention period following
        termination, subject to the export options described in the Terms of Service.
      </p>

      <h2 id="security">9. Security</h2>
      <p>
        We implement administrative, technical, and physical safeguards designed to protect
        personal information, including encryption in transit (TLS), encryption at rest where
        supported by our infrastructure, role-based access controls, multi-tenant database
        row-level security, audit logging, and least-privilege access for personnel. No method of
        transmission or storage is completely secure, however, and we cannot guarantee absolute
        security.
      </p>

      <h2 id="rights">10. Your Rights</h2>
      <p>
        Subject to applicable law, you may have the right to: (a) access the personal information
        we hold about you; (b) request correction of inaccurate information; (c) request deletion
        of your information; (d) request a portable copy of your information; (e) object to or
        restrict certain processing; and (f) withdraw consent where processing is based on consent.
        You may exercise these rights by emailing{" "}
        <a href="mailto:privacy@quicklinq.app">privacy@quicklinq.app</a>. We will verify your
        identity before responding and will respond within the timeframes required by applicable
        law.
      </p>
      <p>
        Where Quiresoft acts as a processor on behalf of a Customer (for example, regarding an End
        Client&rsquo;s information), we will forward your request to the relevant Customer, who is
        the controller of that information.
      </p>
      <p>
        Residents of British Columbia and other Canadian provinces may also contact the Office of
        the Privacy Commissioner of Canada or their provincial regulator. EU/UK residents have the
        right to lodge a complaint with their local data-protection authority.
      </p>

      <h2 id="children">11. Children</h2>
      <p>
        The Service is intended for businesses and is not directed to children under 16. We do not
        knowingly collect personal information from children. If you believe a child has provided
        us with personal information, please contact us so we can delete it.
      </p>

      <h2 id="cookies">12. Cookies &amp; Similar Technologies</h2>
      <p>
        We and our service providers use cookies, local storage, and similar technologies to
        maintain sessions, remember preferences, secure the Service, and measure usage. You can
        configure your browser to refuse cookies, but some parts of the Service may not function
        properly without them.
      </p>

      <h2 id="changes">13. Changes to This Policy</h2>
      <p>
        We may update this policy from time to time. The &ldquo;Last updated&rdquo; date at the top
        indicates when it was last revised. If we make material changes, we will provide additional
        notice (for example, by email or an in-Service banner). Your continued use of the Service
        after the effective date constitutes acceptance of the updated policy.
      </p>

      <h2 id="contact">14. Contact &amp; Privacy Officer</h2>
      <p>
        For privacy questions or to exercise your rights, please contact our Privacy Officer:
      </p>
      <p>
        <strong>Quiresoft Technologies Inc. &mdash; Privacy Officer</strong>
        <br />
        British Columbia, Canada
        <br />
        Email: <a href="mailto:privacy@quicklinq.app">privacy@quicklinq.app</a>
        <br />
        Legal: <a href="mailto:legal@quicklinq.app">legal@quicklinq.app</a>
      </p>
    </LegalLayout>
  );
}
