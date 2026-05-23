import LegalLayout from "@/components/legal/LegalLayout";

const LAST_UPDATED = "May 22, 2026";
const VERSION = "2026-05-22";

const sections = [
  { id: "who", title: "Who We Are" },
  { id: "scope", title: "Scope of This Policy" },
  { id: "collect", title: "Information We Collect" },
  { id: "use", title: "How We Use Information" },
  { id: "legal-basis", title: "Legal Bases for Processing" },
  { id: "sharing", title: "Sharing and Sub-Processors" },
  { id: "transfers", title: "International Data Transfers" },
  { id: "retention", title: "Data Retention" },
  { id: "security", title: "Security and Breach Notification" },
  { id: "rights", title: "Your Rights" },
  { id: "automated", title: "Automated Decision-Making" },
  { id: "children", title: "Children" },
  { id: "cookies", title: "Cookies and Similar Technologies" },
  { id: "casl", title: "Email Communications and CASL" },
  { id: "changes", title: "Changes to This Policy" },
  { id: "contact", title: "Contact and Privacy Officer" },
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
            (<strong>&ldquo;Quiresoft,&rdquo;</strong> <strong>&ldquo;we,&rdquo;</strong>{" "}
            <strong>&ldquo;us&rdquo;</strong>), a corporation registered in British Columbia,
            Canada, collects, uses, discloses, and safeguards personal information through{" "}
            <strong>QuickLinq</strong> (the <strong>&ldquo;Service&rdquo;</strong>), a product
            owned and operated by Quiresoft.
          </p>
          <p>
            We comply with Canada&rsquo;s Personal Information Protection and Electronic Documents
            Act (PIPEDA), Quebec&rsquo;s Act respecting the protection of personal information in
            the private sector (as amended by Law 25), and other applicable provincial privacy
            laws. We provide additional rights where required by the EU and UK GDPR, the
            California Consumer Privacy Act (CCPA, as amended by the CPRA), and other applicable
            laws.
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
        <strong>processor</strong> (or service provider) on the Customer&rsquo;s behalf, and that
        processing is governed by the Data Processing Addendum in Part C.
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
        <li><strong>Cookies and similar technologies:</strong> see Section 13.</li>
      </ul>
      <h3>3.3 Information from third parties</h3>
      <ul>
        <li><strong>Stripe:</strong> account onboarding status, capability and verification results, payout and transaction metadata.</li>
        <li><strong>Identity providers:</strong> if you sign in with a third-party identity provider, basic profile information from that provider.</li>
      </ul>

      <h2 id="use">4. How We Use Information</h2>
      <p>
        We use personal information to: provide, operate, secure, and maintain the Service;
        process subscriptions and platform fees; route payments and payouts through Stripe Connect;
        send service-related communications, including transactional emails (quotes, invoices,
        receipts, review requests) on your behalf and to you; provide customer support; improve
        and develop new features, including by analyzing aggregated or de-identified usage; power
        AI-assisted features (see Section 6); detect, prevent, and address fraud, security
        incidents, and abuse; and comply with legal obligations and enforce our Terms.
      </p>

      <h2 id="legal-basis">5. Legal Bases for Processing</h2>
      <p>
        Where the GDPR or similar laws apply, we rely on the following legal bases: (a){" "}
        <strong>performance of a contract</strong> with you to provide the Service; (b){" "}
        <strong>legitimate interests</strong> in operating, securing, and improving the Service,
        provided those interests are not overridden by your rights; (c){" "}
        <strong>compliance with legal obligations</strong>; and (d) your <strong>consent</strong>,
        where required (for example, for certain marketing communications). Under PIPEDA and
        Quebec&rsquo;s Law 25, we rely on your implied or express consent as appropriate to the
        sensitivity of the information.
      </p>

      <h2 id="sharing">6. Sharing and Sub-Processors</h2>
      <p>
        We do not sell personal information, and we do not share it for cross-context behavioural
        advertising. We share personal information only as described below:
      </p>
      <ul>
        <li>
          <strong>Service providers (sub-processors)</strong> that help us operate the Service
          under written contracts requiring confidentiality and appropriate security, including:
          Supabase (database, authentication, storage, edge functions, hosted via Lovable Cloud);
          Stripe, Inc. and Stripe Payments Canada, Ltd. (payment processing, payouts, Connect
          onboarding); Resend (transactional email delivery); Google and OpenAI, via the Lovable
          AI Gateway (AI Features inference); cloud hosting and CDN providers (infrastructure and
          content delivery); and Apple and Google (push notifications for the mobile app). We
          maintain a current list of sub-processors and will provide notice of material changes as
          described in Part C.
        </li>
        <li><strong>Stripe.</strong> When you or your End Clients use the payment features, payment data is collected and processed directly by Stripe under Stripe&rsquo;s terms and privacy policy.</li>
        <li><strong>Compliance and safety.</strong> We may disclose information when required by law, subpoena, or court order, or to protect the rights, property, or safety of Quiresoft, our Customers, or others.</li>
        <li><strong>Business transfers.</strong> If Quiresoft is involved in a merger, acquisition, or sale of assets, personal information may be transferred subject to standard confidentiality protections.</li>
        <li>With your consent or at your direction.</li>
      </ul>

      <h2 id="transfers">7. International Data Transfers</h2>
      <p>
        Quiresoft is based in Canada. Personal information may be processed and stored in Canada,
        the United States, the European Union, and other jurisdictions where our sub-processors
        operate. Where required, we use lawful transfer mechanisms (such as the European
        Commission&rsquo;s Standard Contractual Clauses and the UK Addendum) and, for transfers
        from Quebec, we conduct the privacy impact assessment required by Law 25 before
        transferring personal information outside the province.
      </p>

      <h2 id="retention">8. Data Retention</h2>
      <p>
        We retain personal information for as long as your Account is active and for a reasonable
        period afterward to comply with legal obligations, resolve disputes, and enforce our
        agreements. As a general matter, Customer Data is deleted or anonymized within ninety (90)
        days following termination of your Account, except where a longer period is required by
        law (for example, financial and tax records) or where data is subject to a legal hold. You
        may export Customer Data using the Service&rsquo;s export tools before termination.
      </p>

      <h2 id="security">9. Security and Breach Notification</h2>
      <p>
        We implement administrative, technical, and physical safeguards designed to protect
        personal information, including encryption in transit (TLS), encryption at rest where
        supported by our infrastructure, role-based access controls, multi-tenant database
        row-level security, audit logging, and least-privilege access for personnel. No method of
        transmission or storage is completely secure, however, and we cannot guarantee absolute
        security.
      </p>
      <p>
        If we become aware of a breach of security safeguards that poses a real risk of significant
        harm to affected individuals, we will report and notify as required by PIPEDA,
        Quebec&rsquo;s Law 25, the GDPR, and other applicable laws, and we will notify affected
        Customers without undue delay so that they can meet their own obligations.
      </p>

      <h2 id="rights">10. Your Rights</h2>
      <p>
        Subject to applicable law, you may have the right to: (a) access the personal information
        we hold about you; (b) request correction of inaccurate information; (c) request deletion
        of your information; (d) request a portable copy of your information; (e) object to or
        restrict certain processing; (f) withdraw consent where processing is based on consent;
        and, for California residents, (g) limit the use of sensitive personal information and not
        be subject to discrimination for exercising your rights. You may exercise these rights by
        emailing <a href="mailto:privacy@quicklinq.app">privacy@quicklinq.app</a>, and you may use
        an authorized agent where the law permits. We will verify your identity before responding
        and will respond within the timeframes required by applicable law.
      </p>
      <p>
        Where Quiresoft acts as a processor on behalf of a Customer (for example, regarding an End
        Client&rsquo;s information), we will forward your request to the relevant Customer, who is
        the controller of that information.
      </p>
      <p>
        Residents of Canadian provinces may contact the Office of the Privacy Commissioner of
        Canada or their provincial regulator, including, for Quebec residents, the Commission
        d&rsquo;acc&egrave;s &agrave; l&rsquo;information du Qu&eacute;bec. EU and UK residents
        have the right to lodge a complaint with their local data-protection authority.
      </p>

      <h2 id="automated">11. Automated Decision-Making</h2>
      <p>
        We do not use your personal information to make decisions based solely on automated
        processing that produce legal or similarly significant effects about you. AI-assisted
        features in the Service generate suggestions for human review and do not replace human
        judgment.
      </p>

      <h2 id="children">12. Children</h2>
      <p>
        The Service is intended for businesses and for users who are at least 18 years old. It is
        not directed to children, and we do not knowingly collect personal information from minors.
        If you believe a minor has provided us with personal information, please contact us so we
        can delete it.
      </p>

      <h2 id="cookies">13. Cookies and Similar Technologies</h2>
      <p>
        We and our service providers use cookies, local storage, and similar technologies to
        maintain sessions, remember preferences, secure the Service, and measure usage. You can
        configure your browser to refuse cookies, but some parts of the Service may not function
        properly without them. Where required by law (for example, in the European Union and
        United Kingdom), we obtain consent before placing non-essential cookies.
      </p>

      <h2 id="casl">14. Email Communications and CASL</h2>
      <p>
        As a Canadian organization, our commercial electronic messages comply with Canada&rsquo;s
        Anti-Spam Legislation (CASL). Each such message identifies us, includes our mailing
        address, and provides an unsubscribe mechanism. Transactional and service messages
        necessary to provide the Service are sent on the basis of our relationship with you. When
        you use the Service to message your own End Clients, you are responsible for holding any
        consent required by CASL or other applicable law to contact them.
      </p>

      <h2 id="changes">15. Changes to This Policy</h2>
      <p>
        We may update this policy from time to time. The &ldquo;Last updated&rdquo; date at the
        top indicates when it was last revised. If we make material changes, we will provide
        additional notice (for example, by email or an in-Service banner). Your continued use of
        the Service after the effective date constitutes acceptance of the updated policy.
      </p>

      <h2 id="contact">16. Contact and Privacy Officer</h2>
      <p>For privacy questions or to exercise your rights, please contact our Privacy Officer:</p>
      <p>
        <strong>Quiresoft Technologies Inc. &mdash; Privacy Officer</strong>
        <br />
        Email: <a href="mailto:privacy@quicklinq.app">privacy@quicklinq.app</a> &middot; Legal:{" "}
        <a href="mailto:legal@quicklinq.app">legal@quicklinq.app</a>
      </p>
    </LegalLayout>
  );
}
