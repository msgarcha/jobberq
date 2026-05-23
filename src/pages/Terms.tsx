import LegalLayout from "@/components/legal/LegalLayout";

const LAST_UPDATED = "May 22, 2026";
const VERSION = "2026-05-22";

const sections = [
  { id: "acceptance", title: "Acceptance and Eligibility" },
  { id: "definitions", title: "Definitions" },
  { id: "accounts", title: "Accounts, Teams and Access" },
  { id: "subscriptions", title: "Subscriptions, Trials, Billing and Taxes" },
  { id: "stripe", title: "Payment Processing Through Stripe" },
  { id: "data", title: "Customer Data and Content" },
  { id: "aup", title: "Acceptable Use Policy" },
  { id: "ai", title: "AI-Assisted Features" },
  { id: "third-party", title: "Third-Party Services and Integrations" },
  { id: "confidentiality", title: "Confidentiality" },
  { id: "ip", title: "Intellectual Property" },
  { id: "term", title: "Term, Suspension and Termination" },
  { id: "disclaimers", title: "Disclaimers and Warranties" },
  { id: "liability", title: "Limitation of Liability" },
  { id: "indemnity", title: "Indemnification" },
  { id: "security", title: "Security and Breach Notification" },
  { id: "force-majeure", title: "Force Majeure" },
  { id: "law", title: "Governing Law and Dispute Resolution" },
  { id: "changes", title: "Changes to the Terms" },
  { id: "general", title: "Notices, Assignment and Miscellaneous" },
  { id: "contact", title: "Contact" },
];

export default function Terms() {
  return (
    <LegalLayout
      title="Terms of Service"
      description="The terms governing your use of QuickLinq, a product owned and operated by Quiresoft Technologies Inc."
      path="/terms"
      lastUpdated={LAST_UPDATED}
      version={VERSION}
      sections={sections}
      intro={
        <>
          <p>
            These Terms of Service (the <strong>&ldquo;Terms&rdquo;</strong>) form a binding
            agreement between you (the <strong>&ldquo;Customer,&rdquo;</strong>{" "}
            <strong>&ldquo;you&rdquo;</strong>) and{" "}
            <strong>Quiresoft Technologies Inc.</strong> (<strong>&ldquo;Quiresoft,&rdquo;</strong>{" "}
            <strong>&ldquo;we,&rdquo;</strong> <strong>&ldquo;us,&rdquo;</strong> or{" "}
            <strong>&ldquo;our&rdquo;</strong>), a corporation registered in the Province of British
            Columbia, Canada. <strong>QuickLinq</strong> (the{" "}
            <strong>&ldquo;Service&rdquo;</strong>) is a product owned and operated by Quiresoft.
            By creating an account, clicking &ldquo;I agree,&rdquo; or using the Service, you
            confirm that you have read, understood, and accept these Terms and our{" "}
            <a href="/privacy">Privacy Policy</a> (Part B). If you do not agree, do not use the
            Service.
          </p>
        </>
      }
    >
      <h2 id="acceptance">1. Acceptance and Eligibility</h2>
      <p>
        You may use the Service only if you can form a legally binding contract with Quiresoft, are
        at least 18 years of age (or the age of majority in your jurisdiction, whichever is greater),
        and are not barred from using the Service under the laws of Canada or any other applicable
        jurisdiction. If you are accepting these Terms on behalf of a company or other legal entity,
        you represent that you have the authority to bind that entity, in which case
        &ldquo;Customer&rdquo; or &ldquo;you&rdquo; refers to that entity.
      </p>

      <h2 id="definitions">2. Definitions</h2>
      <ul>
        <li><strong>&ldquo;Service&rdquo;</strong> means the QuickLinq web and mobile applications, APIs, documentation, and related services made available by Quiresoft.</li>
        <li><strong>&ldquo;Account&rdquo;</strong> means your QuickLinq account, including any team workspace under your control.</li>
        <li><strong>&ldquo;End Client&rdquo;</strong> means a customer of the Customer to whom the Customer sends quotes, invoices, or other documents using the Service.</li>
        <li><strong>&ldquo;Customer Data&rdquo;</strong> means any data, content, or information that you, your team members, or your End Clients submit to or generate through the Service.</li>
        <li><strong>&ldquo;Stripe&rdquo;</strong> means Stripe, Inc. and its affiliates, including Stripe Payments Canada, Ltd.</li>
      </ul>

      <h2 id="accounts">3. Accounts, Teams and Access</h2>
      <p>
        You are responsible for maintaining the confidentiality of your credentials and for all
        activities that occur under your Account. You must notify us immediately of any unauthorized
        use of your Account. Account access may be shared with team members you invite, subject to
        the role-based permissions exposed in the Service. You are responsible for the acts and
        omissions of your team members and for ensuring that they comply with these Terms.
      </p>

      <h2 id="subscriptions">4. Subscriptions, Trials, Billing and Taxes</h2>
      <p>
        The Service is offered on a subscription basis. The subscription fee, which we may also
        refer to as the platform fee, is the fee you pay Quiresoft for access to the Service. Free
        trials, if offered, are limited to the duration disclosed at signup and convert to a paid
        subscription only if you elect to continue.
      </p>
      <p>
        Subscription fees are billed in advance on a recurring basis (monthly or annual, as
        selected) and are non-refundable except as required by law or as expressly provided in
        Section 12. You authorize us, or our payment processor, to charge your payment method on
        each renewal until you cancel. You may cancel at any time from the Service settings,
        effective at the end of the then-current billing period. You are responsible for all taxes
        (including GST, HST, PST, VAT, and sales tax) associated with your use of the Service,
        other than taxes based on our net income.
      </p>
      <p>
        We may modify subscription fees on notice. New pricing applies to the next renewal period
        following the notice. If you do not agree to revised fees, your sole remedy is to cancel
        before the next renewal. If a payment fails, we may suspend your access to the Service
        after providing reasonable notice. Repeated payment failure may result in termination of
        your Account.
      </p>

      <h2 id="stripe">5. Payment Processing Through Stripe</h2>
      <p>
        The Service lets you accept payments from your End Clients. All payment card processing,
        payouts, refunds, chargebacks, and dispute handling made available through the Service are
        provided by <strong>Stripe, Inc.</strong> and, in Canada,{" "}
        <strong>Stripe Payments Canada, Ltd.</strong> (collectively,{" "}
        <strong>&ldquo;Stripe&rdquo;</strong>). By using the payment features of the Service, you
        and your End Clients agree to be bound by the:
      </p>
      <ul>
        <li><a href="https://stripe.com/legal/ssa" target="_blank" rel="noopener noreferrer">Stripe Services Agreement</a> (stripe.com/legal/ssa);</li>
        <li><a href="https://stripe.com/connect-account/legal/full" target="_blank" rel="noopener noreferrer">Stripe Connected Account Agreement</a> (stripe.com/connect-account/legal/full); and</li>
        <li><a href="https://stripe.com/legal/end-users" target="_blank" rel="noopener noreferrer">Stripe End-User Terms of Service</a> (stripe.com/legal/end-users).</li>
      </ul>
      <p>
        <strong>
          Quiresoft is not a payment processor, bank, or money transmitter, and is not the merchant
          of record for transactions between you and your End Clients.
        </strong>{" "}
        As the operator of your connected Stripe account, you are the merchant of record for those
        transactions. Quiresoft does not custody funds. All processed funds are held and disbursed
        by Stripe in accordance with Stripe&rsquo;s terms. Stripe is responsible for compliance
        with applicable payment, anti-money-laundering, and know-your-customer laws.
      </p>
      <p>
        <strong>No transaction fee charged by Quiresoft.</strong> Quiresoft does not charge a
        percentage-based application fee and does not take any portion of the amounts you collect
        from your End Clients. The only fees deducted from payments processed through the Service
        are Stripe&rsquo;s own processing fees, which are governed by your agreement with Stripe
        and payable by you to Stripe. Quiresoft&rsquo;s compensation for the Service is the
        subscription fee described in Section 4. If Quiresoft introduces any additional fee in the
        future, it will be disclosed in the Service before it applies.
      </p>
      <p>
        Refunds, disputes, and chargebacks are handled in accordance with Stripe&rsquo;s policies.
        Quiresoft is not a party to any transaction between you and your End Clients and has no
        liability for failed, delayed, reversed, or disputed payments, except as expressly required
        by law.
      </p>

      <h2 id="data">6. Customer Data and Content</h2>
      <p>
        As between you and Quiresoft, you retain all right, title, and interest in and to your
        Customer Data. You grant Quiresoft a worldwide, non-exclusive, royalty-free license to
        host, copy, transmit, display, and process Customer Data solely as necessary to provide,
        secure, and support the Service, to comply with law, and as otherwise permitted by these
        Terms or our <a href="/privacy">Privacy Policy</a>. We may use aggregated or de-identified
        data that does not identify you, your team, or your End Clients to operate and improve the
        Service.
      </p>
      <p>
        You represent that you have all rights, consents, and authorities necessary to submit
        Customer Data to the Service and to grant the license above, including any consents
        required to enter and process information about your End Clients. We maintain reasonable
        backups of Customer Data, but you are responsible for maintaining your own copies.
      </p>

      <h2 id="aup">7. Acceptable Use Policy</h2>
      <p>You agree not to, and not to permit any third party to:</p>
      <ul>
        <li>use the Service to violate any applicable law or third-party right;</li>
        <li>send unsolicited commercial communications or spam, or content that is fraudulent, deceptive, defamatory, harassing, obscene, or otherwise unlawful, including in breach of Canada&rsquo;s Anti-Spam Legislation (CASL) or other applicable communications laws;</li>
        <li>send messages to End Clients without holding the consent required by applicable law to contact them;</li>
        <li>upload viruses, malware, or other harmful code, or attempt to gain unauthorized access to any portion of the Service or its underlying systems;</li>
        <li>interfere with or disrupt the integrity or performance of the Service;</li>
        <li>reverse engineer, decompile, or attempt to derive the source code of any part of the Service, except as expressly permitted by law;</li>
        <li>use the Service to process payments for goods or services prohibited by Stripe&rsquo;s acceptable use policies; or</li>
        <li>resell, sublicense, or make the Service available to any third party except as expressly permitted.</li>
      </ul>
      <p>We may suspend or terminate Accounts that violate this policy without prior notice.</p>

      <h2 id="ai">8. AI-Assisted Features</h2>
      <p>
        The Service includes AI-assisted features (collectively,{" "}
        <strong>&ldquo;AI Features&rdquo;</strong>) such as document drafting suggestions, the
        in-app assistant, and review-response generation. Inputs you provide to AI Features, which
        may include Customer Data and information about your End Clients, may be transmitted to and
        processed by third-party model providers (including Google and OpenAI) through the Lovable
        AI Gateway in order to generate outputs.
      </p>
      <p>
        Based on our current agreements with these providers, inputs submitted through the Service
        are not used to train their foundation models. AI Features do not make legal, financial, or
        other decisions that produce significant effects about any person without human involvement;
        they generate suggestions only. Outputs are provided on an &ldquo;as is&rdquo; basis, may
        be inaccurate, and should be reviewed for correctness before you rely on, send, or publish
        them. You are solely responsible for any content you accept, edit, send, or publish from AI
        Features.
      </p>

      <h2 id="third-party">9. Third-Party Services and Integrations</h2>
      <p>
        The Service interoperates with third-party services (including Stripe, email delivery
        providers, hosting and storage providers, and AI providers). Your use of those services is
        governed by their own terms, and Quiresoft is not responsible for the acts, omissions, or
        outages of any third-party service.
      </p>

      <h2 id="confidentiality">10. Confidentiality</h2>
      <p>
        Each party may receive non-public information from the other that is identified as
        confidential or that, given the nature of the information and the circumstances of
        disclosure, reasonably should be understood to be confidential
        (<strong>&ldquo;Confidential Information&rdquo;</strong>). Each party will protect the
        other&rsquo;s Confidential Information using at least the same care it uses to protect its
        own, and will use such information only to perform under these Terms.
      </p>

      <h2 id="ip">11. Intellectual Property</h2>
      <p>
        Quiresoft and its licensors own all right, title, and interest in and to the Service,
        including all related software, designs, trademarks, and documentation. Subject to your
        compliance with these Terms, Quiresoft grants you a limited, non-exclusive, non-transferable,
        non-sublicensable right to access and use the Service for your internal business purposes
        during the subscription term. We welcome feedback; if you submit suggestions or feedback,
        you grant us a perpetual, irrevocable, royalty-free license to use it without restriction.
      </p>

      <h2 id="term">12. Term, Suspension and Termination</h2>
      <p>
        These Terms remain in effect while you have an Account. You may cancel at any time from the
        Service settings. We may suspend or terminate your Account or access to the Service: (a) if
        you materially breach these Terms and fail to cure within ten (10) days of notice; (b)
        immediately for any breach of Section 7 (Acceptable Use), non-payment, or activity that
        poses a security or legal risk; or (c) on at least thirty (30) days&rsquo; notice for
        convenience.
      </p>
      <p>
        If we terminate your Account for convenience under clause (c) above, we will refund the
        pro-rata portion of any prepaid subscription fees covering the period after the effective
        date of termination. No refund is owed where we terminate for your breach or under clause
        (a) or (b). Upon termination, your right to access the Service ends. You may export
        Customer Data using the Service&rsquo;s export tools prior to termination; following
        termination, we will delete or anonymize Customer Data in accordance with the Privacy
        Policy.
      </p>

      <h2 id="disclaimers">13. Disclaimers and Warranties</h2>
      <p>
        <strong>
          THE SERVICE IS PROVIDED &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE,&rdquo; WITHOUT
          WARRANTIES OF ANY KIND, WHETHER EXPRESS, IMPLIED, OR STATUTORY, INCLUDING WARRANTIES OF
          MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT.
        </strong>
      </p>
      <p>
        Quiresoft does not warrant that the Service will be uninterrupted, error-free, or secure,
        or that any defects will be corrected. Some jurisdictions do not allow the exclusion of
        implied warranties; in those jurisdictions, the above exclusions apply to the maximum
        extent permitted by law.
      </p>

      <h2 id="liability">14. Limitation of Liability</h2>
      <p>
        <strong>
          TO THE MAXIMUM EXTENT PERMITTED BY LAW, IN NO EVENT WILL QUIRESOFT, ITS AFFILIATES, OR
          ITS LICENSORS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, EXEMPLARY,
          OR PUNITIVE DAMAGES, OR FOR ANY LOSS OF PROFITS, REVENUE, DATA, GOODWILL, OR BUSINESS
          OPPORTUNITY, ARISING OUT OF OR RELATED TO THESE TERMS OR THE SERVICE, EVEN IF ADVISED OF
          THE POSSIBILITY OF SUCH DAMAGES.
        </strong>
      </p>
      <p>
        <strong>
          THE AGGREGATE LIABILITY OF QUIRESOFT AND ITS AFFILIATES ARISING OUT OF OR RELATED TO
          THESE TERMS OR THE SERVICE WILL NOT EXCEED THE TOTAL SUBSCRIPTION FEES ACTUALLY PAID BY
          YOU TO QUIRESOFT FOR THE SERVICE IN THE TWELVE (12) MONTHS IMMEDIATELY PRECEDING THE
          EVENT GIVING RISE TO THE CLAIM.
        </strong>
      </p>
      <p>
        For clarity, the cap above is calculated on subscription fees paid to Quiresoft and does
        not include amounts processed by Stripe, which Quiresoft never receives or holds. Without
        limiting the foregoing, Quiresoft has no liability for (i) payments, refunds, chargebacks,
        payouts, or other amounts handled by Stripe; (ii) losses caused by your violation of the
        Acceptable Use Policy; (iii) acts or omissions of End Clients or third parties; or (iv)
        any AI-Feature output you choose to rely on or transmit. These limitations form an
        essential basis of the bargain between the parties.
      </p>

      <h2 id="indemnity">15. Indemnification</h2>
      <p>
        <strong>By you.</strong> You will defend, indemnify, and hold harmless Quiresoft, its
        affiliates, and their respective officers, directors, employees, and agents from and
        against any claim, demand, loss, liability, damage, or expense (including reasonable legal
        fees) arising out of or related to (a) your Customer Data; (b) your use of the Service in
        breach of these Terms or applicable law; (c) any dispute between you and an End Client;
        or (d) your violation of any third-party right.
      </p>
      <p>
        <strong>By us.</strong> Quiresoft will defend you against any third-party claim alleging
        that the Service, as provided by us and used in accordance with these Terms, infringes a
        valid Canadian copyright, trademark, or registered patent, and will indemnify you for
        amounts finally awarded against you by a court of competent jurisdiction or paid in a
        settlement we approve. This obligation does not apply to claims arising from Customer Data,
        your misuse of the Service, or combination of the Service with items not supplied by us.
        The total amount paid by Quiresoft under this paragraph is subject to the limitations in
        Section 14.
      </p>

      <h2 id="security">16. Security and Breach Notification</h2>
      <p>
        We maintain administrative, technical, and physical safeguards designed to protect the
        Service and Customer Data, as further described in the Privacy Policy. If we become aware
        of a breach of security leading to the accidental or unlawful destruction, loss,
        alteration, or unauthorized disclosure of or access to Customer Data that poses a real
        risk of significant harm, we will notify affected Customers without undue delay and will
        cooperate as reasonably required for you to meet your own notification obligations under
        PIPEDA, Quebec&rsquo;s Law 25, the GDPR, and other applicable laws.
      </p>

      <h2 id="force-majeure">17. Force Majeure</h2>
      <p>
        Neither party will be liable for any delay or failure to perform (other than payment
        obligations) caused by events beyond its reasonable control, including acts of God, natural
        disasters, war, terrorism, civil unrest, labour disputes, governmental action, internet or
        telecommunications failures, or failures of third-party services or infrastructure
        providers.
      </p>

      <h2 id="law">18. Governing Law and Dispute Resolution</h2>
      <p>
        These Terms are governed by the laws of the Province of British Columbia, Canada, and the
        federal laws of Canada applicable therein, without regard to conflict-of-laws principles.
        The parties submit to the exclusive jurisdiction of the courts located in Vancouver,
        British Columbia for the resolution of any dispute arising out of or related to these
        Terms or the Service, except that either party may seek injunctive relief in any court of
        competent jurisdiction to protect its intellectual property or confidential information.
        The United Nations Convention on Contracts for the International Sale of Goods does not
        apply. Nothing in these Terms limits any non-waivable rights you have under the
        consumer-protection laws of your jurisdiction.
      </p>

      <h2 id="changes">19. Changes to the Terms</h2>
      <p>
        We may update these Terms from time to time. If we make a material change, we will provide
        notice (for example, by email or in the Service) at least thirty (30) days before the
        change takes effect, unless the change is required by law or addresses a security issue,
        in which case it may take effect sooner. Your continued use of the Service after the
        effective date constitutes acceptance of the updated Terms.
      </p>

      <h2 id="general">20. Notices, Assignment and Miscellaneous</h2>
      <p>
        Notices to you may be sent to the email address on your Account or posted in the Service.
        Notices to us must be sent to <a href="mailto:legal@quicklinq.app">legal@quicklinq.app</a>.
        You may not assign these Terms without our prior written consent; we may assign these Terms
        in connection with a merger, acquisition, or sale of substantially all of our assets. If
        any provision is held unenforceable, the remaining provisions will remain in effect. No
        waiver is effective unless in writing. These Terms, together with the Privacy Policy, the
        Data Processing Addendum, and any order form or plan-specific terms, constitute the entire
        agreement between the parties regarding the Service.
      </p>

      <h2 id="contact">21. Contact</h2>
      <p>
        <strong>Quiresoft Technologies Inc.</strong>
        <br />
        British Columbia, Canada
        <br />
        Legal: <a href="mailto:legal@quicklinq.app">legal@quicklinq.app</a> &middot; Support:{" "}
        <a href="mailto:support@quicklinq.app">support@quicklinq.app</a>
      </p>
    </LegalLayout>
  );
}
