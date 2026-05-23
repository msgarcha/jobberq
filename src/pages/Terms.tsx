import LegalLayout from "@/components/legal/LegalLayout";

const LAST_UPDATED = "May 23, 2026";
const VERSION = "2026-05-23";

const sections = [
  { id: "acceptance", title: "Acceptance & Eligibility" },
  { id: "definitions", title: "Definitions" },
  { id: "accounts", title: "Accounts, Teams & Access" },
  { id: "subscriptions", title: "Subscriptions, Trials, Billing & Taxes" },
  { id: "stripe", title: "Payment Processing Through Stripe" },
  { id: "data", title: "Customer Data & Content" },
  { id: "aup", title: "Acceptable Use Policy" },
  { id: "ai", title: "AI-Assisted Features" },
  { id: "third-party", title: "Third-Party Services & Integrations" },
  { id: "confidentiality", title: "Confidentiality" },
  { id: "ip", title: "Intellectual Property" },
  { id: "term", title: "Term, Suspension & Termination" },
  { id: "disclaimers", title: "Disclaimers & Warranties" },
  { id: "liability", title: "Limitation of Liability" },
  { id: "indemnity", title: "Indemnification" },
  { id: "law", title: "Governing Law & Dispute Resolution" },
  { id: "changes", title: "Changes to the Terms" },
  { id: "general", title: "Notices, Assignment & Miscellaneous" },
  { id: "contact", title: "Contact" },
];

export default function Terms() {
  return (
    <LegalLayout
      title="Terms of Service"
      description="The terms governing your use of QuickLinq, a product of Quiresoft Technologies Inc."
      path="/terms"
      lastUpdated={LAST_UPDATED}
      version={VERSION}
      sections={sections}
      intro={
        <>
          <p className="mb-3">
            These Terms of Service (the <strong>&ldquo;Terms&rdquo;</strong>) form a binding
            agreement between you (the <strong>&ldquo;Customer&rdquo;</strong>,{" "}
            <strong>&ldquo;you&rdquo;</strong>) and{" "}
            <strong>Quiresoft Technologies Inc.</strong> (<strong>&ldquo;Quiresoft&rdquo;</strong>,{" "}
            <strong>&ldquo;we&rdquo;</strong>, <strong>&ldquo;us&rdquo;</strong>, or{" "}
            <strong>&ldquo;our&rdquo;</strong>), a corporation registered in the Province of British
            Columbia, Canada. <strong>QuickLinq</strong> (the <strong>&ldquo;Service&rdquo;</strong>)
            is a wholly-owned subsidiary product of Quiresoft.
          </p>
          <p>
            By creating an account, clicking &ldquo;I agree,&rdquo; or using the Service, you
            confirm that you have read, understood, and accept these Terms and our{" "}
            <a href="/privacy">Privacy Policy</a>. If you do not agree, do not use the Service.
          </p>
        </>
      }
    >
      <h2 id="acceptance">1. Acceptance &amp; Eligibility</h2>
      <p>
        You may use the Service only if you can form a legally binding contract with Quiresoft, are
        at least 18 years of age (or the age of majority in your jurisdiction), and are not barred
        from using the Service under the laws of Canada or any other applicable jurisdiction. If
        you are accepting these Terms on behalf of a company or other legal entity, you represent
        that you have the authority to bind that entity, in which case &ldquo;Customer&rdquo; or
        &ldquo;you&rdquo; refers to that entity.
      </p>

      <h2 id="definitions">2. Definitions</h2>
      <ul>
        <li><strong>&ldquo;Service&rdquo;</strong> means the QuickLinq web and mobile applications, APIs, documentation, and related services made available by Quiresoft.</li>
        <li><strong>&ldquo;Account&rdquo;</strong> means your QuickLinq account, including any team workspace under your control.</li>
        <li><strong>&ldquo;End Client&rdquo;</strong> means a customer of the Customer to whom the Customer sends quotes, invoices, or other documents using the Service.</li>
        <li><strong>&ldquo;Customer Data&rdquo;</strong> means any data, content, or information that you, your team members, or your End Clients submit to or generate through the Service.</li>
        <li><strong>&ldquo;Stripe&rdquo;</strong> means Stripe, Inc. and its affiliates, including Stripe Payments Canada, Ltd.</li>
      </ul>

      <h2 id="accounts">3. Accounts, Teams &amp; Access</h2>
      <p>
        You are responsible for maintaining the confidentiality of your credentials and for all
        activities that occur under your Account. You must notify us immediately of any unauthorized
        use of your Account. Account access may be shared with team members you invite, subject to
        the role-based permissions exposed in the Service. You are responsible for the acts and
        omissions of your team members and for ensuring that they comply with these Terms.
      </p>

      <h2 id="subscriptions">4. Subscriptions, Trials, Billing &amp; Taxes</h2>
      <p>
        The Service is offered on a subscription basis. Free trials, if offered, are limited to the
        duration disclosed at signup and convert to a paid subscription only if you elect to
        continue. Subscription fees are billed in advance on a recurring basis (monthly or annual,
        as selected) and are non-refundable except as required by law. You authorize us, or our
        payment processor, to charge your payment method on each renewal until you cancel. You are
        responsible for all taxes (including GST, HST, PST, VAT, and sales tax) associated with
        your use of the Service, other than taxes based on our net income.
      </p>
      <p>
        We may modify fees on notice. New pricing applies to the next renewal period following the
        notice. If you do not agree to revised fees, your sole remedy is to cancel before the next
        renewal.
      </p>
      <p>
        If a payment fails, we may suspend your access to the Service after providing reasonable
        notice. Repeated payment failure may result in termination of your Account.
      </p>

      <h2 id="stripe">5. Payment Processing Through Stripe</h2>
      <p>
        All payment card processing, payouts, refunds, chargebacks, dispute handling, and
        merchant-of-record functions made available through the Service are provided by{" "}
        <strong>Stripe, Inc.</strong> and, in Canada, <strong>Stripe Payments Canada, Ltd.</strong>
        (collectively, <strong>&ldquo;Stripe&rdquo;</strong>). By using the payment features of the
        Service, you and your End Clients agree to be bound by the:
      </p>
      <ul>
        <li>
          <a href="https://stripe.com/legal/ssa" target="_blank" rel="noopener noreferrer">Stripe Services Agreement</a>
        </li>
        <li>
          <a href="https://stripe.com/connect-account/legal/full" target="_blank" rel="noopener noreferrer">Stripe Connected Account Agreement</a>
        </li>
        <li>
          <a href="https://stripe.com/legal/end-users" target="_blank" rel="noopener noreferrer">Stripe End-User Terms of Service</a>
        </li>
      </ul>
      <p>
        <strong>Quiresoft is not a payment processor, bank, or money transmitter.</strong>{" "}
        Quiresoft does not custody funds. All processed funds are held and disbursed by Stripe in
        accordance with Stripe&rsquo;s terms. Stripe is solely responsible for compliance with
        applicable payment, anti-money-laundering, and know-your-customer laws.
      </p>
      <p>
        Quiresoft charges a platform application fee on each successful payment processed through
        the Service. The current application fee is <strong>ten percent (10%)</strong> of the gross
        transaction amount, deducted at the time of processing. This is in addition to Stripe&rsquo;s
        own processing fees, which are governed by your agreement with Stripe. Application fees
        are disclosed in the Service and may change on notice.
      </p>
      <p>
        Refunds, disputes, and chargebacks are handled in accordance with Stripe&rsquo;s policies.
        Quiresoft is not a party to any transaction between you and your End Clients and has no
        liability for failed, delayed, reversed, or disputed payments, except as expressly required
        by law.
      </p>

      <h2 id="data">6. Customer Data &amp; Content</h2>
      <p>
        As between you and Quiresoft, you retain all right, title, and interest in and to your
        Customer Data. You grant Quiresoft a worldwide, non-exclusive, royalty-free license to
        host, copy, transmit, display, and process Customer Data solely as necessary to provide,
        secure, support, and improve the Service, to comply with law, and as otherwise permitted by
        these Terms or our <a href="/privacy">Privacy Policy</a>.
      </p>
      <p>
        You represent that you have all rights, consents, and authorities necessary to submit
        Customer Data to the Service and to grant the license above. We maintain reasonable backups
        of Customer Data but you are responsible for maintaining your own copies.
      </p>

      <h2 id="aup">7. Acceptable Use Policy</h2>
      <p>You agree not to, and not to permit any third party to:</p>
      <ul>
        <li>use the Service to violate any applicable law or third-party right;</li>
        <li>send unsolicited communications, spam, or content that is fraudulent, deceptive, defamatory, harassing, obscene, or otherwise unlawful;</li>
        <li>upload viruses, malware, or other harmful code, or attempt to gain unauthorized access to any portion of the Service or its underlying systems;</li>
        <li>interfere with or disrupt the integrity or performance of the Service;</li>
        <li>reverse engineer, decompile, or attempt to derive the source code of any part of the Service, except as expressly permitted by law;</li>
        <li>use the Service to process payments for goods or services prohibited by Stripe&rsquo;s acceptable use policies; or</li>
        <li>resell, sublicense, or make the Service available to any third party except as expressly permitted.</li>
      </ul>
      <p>We may suspend or terminate Accounts that violate this policy without prior notice.</p>

      <h2 id="ai">8. AI-Assisted Features</h2>
      <p>
        The Service includes AI-assisted features (collectively, <strong>&ldquo;AI Features&rdquo;</strong>)
        such as document drafting suggestions, the in-app assistant, and review-response generation.
        Inputs you provide to AI Features may be transmitted to and processed by third-party model
        providers (including Google and OpenAI) through the Lovable AI Gateway. Outputs are provided
        on an &ldquo;as is&rdquo; basis, may be inaccurate, and should be reviewed for correctness
        before you rely on, send, or publish them. You are solely responsible for any content you
        accept, edit, send, or publish from AI Features.
      </p>

      <h2 id="third-party">9. Third-Party Services &amp; Integrations</h2>
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

      <h2 id="term">12. Term, Suspension &amp; Termination</h2>
      <p>
        These Terms remain in effect while you have an Account. You may cancel at any time from the
        Service settings. We may suspend or terminate your Account or access to the Service: (a) if
        you materially breach these Terms and fail to cure within ten (10) days of notice; (b)
        immediately for any breach of Section 7 (Acceptable Use), non-payment, or activity that
        poses a security or legal risk; or (c) on at least thirty (30) days&rsquo; notice for
        convenience. Upon termination, your right to access the Service ends. You may export
        Customer Data using the Service&rsquo;s export tools prior to termination; following
        termination, we may delete Customer Data after a reasonable retention period.
      </p>

      <h2 id="disclaimers">13. Disclaimers &amp; Warranties</h2>
      <p>
        <strong>
          THE SERVICE IS PROVIDED &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE,&rdquo; WITHOUT
          WARRANTIES OF ANY KIND, WHETHER EXPRESS, IMPLIED, OR STATUTORY, INCLUDING WARRANTIES OF
          MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT.
        </strong>{" "}
        Quiresoft does not warrant that the Service will be uninterrupted, error-free, or secure,
        or that any defects will be corrected. Some jurisdictions do not allow the exclusion of
        implied warranties; in those jurisdictions, the above exclusions apply to the maximum extent
        permitted by law.
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
          THESE TERMS OR THE SERVICE WILL NOT EXCEED THE AMOUNTS ACTUALLY PAID BY YOU TO QUIRESOFT
          FOR THE SERVICE IN THE TWELVE (12) MONTHS IMMEDIATELY PRECEDING THE EVENT GIVING RISE TO
          THE CLAIM.
        </strong>
      </p>
      <p>
        Without limiting the foregoing, Quiresoft has no liability for (i) payments, refunds,
        chargebacks, payouts, or other amounts handled by Stripe; (ii) losses caused by your
        violation of the Acceptable Use Policy; (iii) acts or omissions of End Clients or third
        parties; or (iv) any AI-Feature output you choose to rely on or transmit. These limitations
        form an essential basis of the bargain between the parties.
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
        settlement we approve. The total amount paid by Quiresoft under this paragraph is subject
        to the limitations in Section 14.
      </p>

      <h2 id="law">16. Governing Law &amp; Dispute Resolution</h2>
      <p>
        These Terms are governed by the laws of the Province of British Columbia, Canada, and the
        federal laws of Canada applicable therein, without regard to conflict-of-laws principles.
        The parties submit to the exclusive jurisdiction of the courts located in Vancouver,
        British Columbia for the resolution of any dispute arising out of or related to these
        Terms or the Service, except that either party may seek injunctive relief in any court of
        competent jurisdiction to protect its intellectual property or confidential information.
        The United Nations Convention on Contracts for the International Sale of Goods does not
        apply.
      </p>

      <h2 id="changes">17. Changes to the Terms</h2>
      <p>
        We may update these Terms from time to time. If we make a material change, we will provide
        notice (for example, by email or in the Service) at least thirty (30) days before the
        change takes effect, unless the change is required by law or addresses a security issue, in
        which case it may take effect sooner. Your continued use of the Service after the effective
        date constitutes acceptance of the updated Terms.
      </p>

      <h2 id="general">18. Notices, Assignment &amp; Miscellaneous</h2>
      <p>
        Notices to you may be sent to the email address on your Account or posted in the Service.
        Notices to us must be sent to <strong>legal@quicklinq.app</strong>. You may not assign
        these Terms without our prior written consent; we may assign these Terms in connection
        with a merger, acquisition, or sale of substantially all of our assets. If any provision
        is held unenforceable, the remaining provisions will remain in effect. No waiver is
        effective unless in writing. These Terms, together with the Privacy Policy and any order
        form or plan-specific terms, constitute the entire agreement between the parties regarding
        the Service.
      </p>

      <h2 id="contact">19. Contact</h2>
      <p>
        <strong>Quiresoft Technologies Inc.</strong>
        <br />
        British Columbia, Canada
        <br />
        Legal: <a href="mailto:legal@quicklinq.app">legal@quicklinq.app</a>
        <br />
        Support: <a href="mailto:support@quicklinq.app">support@quicklinq.app</a>
      </p>
    </LegalLayout>
  );
}
