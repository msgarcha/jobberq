import LegalLayout from "@/components/legal/LegalLayout";

const LAST_UPDATED = "May 22, 2026";
const VERSION = "2026-05-22";

const sections = [
  { id: "roles", title: "Roles and Scope" },
  { id: "instructions", title: "Processing Instructions" },
  { id: "confidentiality", title: "Confidentiality and Security" },
  { id: "sub-processors", title: "Sub-Processors" },
  { id: "requests", title: "Data Subject Requests" },
  { id: "breach", title: "Breach Notification" },
  { id: "deletion", title: "Deletion and Return" },
  { id: "audits", title: "Audits and International Transfers" },
];

export default function Dpa() {
  return (
    <LegalLayout
      title="Data Processing Addendum"
      description="The Data Processing Addendum (DPA) governing Quiresoft's processing of personal information on behalf of QuickLinq Customers."
      path="/dpa"
      lastUpdated={LAST_UPDATED}
      version={VERSION}
      sections={sections}
      intro={
        <p>
          This Data Processing Addendum (<strong>&ldquo;DPA&rdquo;</strong>) forms part of the{" "}
          <a href="/terms">Terms of Service</a> between the Customer (acting as controller) and{" "}
          <strong>Quiresoft Technologies Inc.</strong> (acting as processor) and applies to
          Quiresoft&rsquo;s processing of personal information about the Customer&rsquo;s End
          Clients and other individuals on the Customer&rsquo;s behalf. It is intended to satisfy
          Article 28 of the GDPR and the comparable accountability requirements of PIPEDA and
          Quebec&rsquo;s Law 25. If there is any conflict between this DPA and the Terms regarding
          the processing of such personal information, this DPA controls.
        </p>
      }
    >
      <h2 id="roles">1. Roles and Scope</h2>
      <p>
        For personal information that the Customer submits about its End Clients, jobs, quotes,
        and invoices, the Customer is the controller and Quiresoft is the processor. Quiresoft
        processes such personal information only to provide the Service and as instructed by the
        Customer. The subject matter is the provision of the Service; the duration is the term of
        the Account; the nature and purpose are the operation of field-service management,
        quoting, invoicing, scheduling, and payment-related functions; the types of data are those
        described in Section 3 of the <a href="/privacy">Privacy Policy</a>; and the data subjects
        are the Customer&rsquo;s End Clients and personnel.
      </p>

      <h2 id="instructions">2. Processing Instructions</h2>
      <p>
        Quiresoft will process personal information only on the documented instructions of the
        Customer, including as set out in the Terms and this DPA, unless required to do otherwise
        by law, in which case Quiresoft will inform the Customer of that legal requirement before
        processing unless prohibited from doing so.
      </p>

      <h2 id="confidentiality">3. Confidentiality and Security</h2>
      <p>
        Quiresoft ensures that personnel authorized to process personal information are bound by
        confidentiality obligations. Quiresoft maintains the technical and organizational security
        measures described in Section 9 of the Privacy Policy, appropriate to the risk.
      </p>

      <h2 id="sub-processors">4. Sub-Processors</h2>
      <p>
        The Customer authorizes Quiresoft to engage the sub-processors listed in Section 6 of the
        Privacy Policy. Quiresoft imposes data-protection obligations on each sub-processor that
        are no less protective than those in this DPA and remains responsible for their
        performance. Quiresoft will maintain an up-to-date list of sub-processors and will give
        the Customer reasonable prior notice of the addition or replacement of a sub-processor,
        allowing the Customer to object on reasonable data-protection grounds.
      </p>

      <h2 id="requests">5. Data Subject Requests</h2>
      <p>
        Taking into account the nature of the processing, Quiresoft will assist the Customer by
        appropriate technical and organizational measures, insofar as possible, in responding to
        requests from individuals exercising their rights under applicable law. Where Quiresoft
        receives such a request directly, it will forward it to the Customer.
      </p>

      <h2 id="breach">6. Breach Notification</h2>
      <p>
        Quiresoft will notify the Customer without undue delay after becoming aware of a
        personal-data breach affecting the Customer&rsquo;s data, and will provide information
        reasonably available to assist the Customer in meeting its own breach-notification and
        reporting obligations under PIPEDA, Law 25, the GDPR, and other applicable laws.
      </p>

      <h2 id="deletion">7. Deletion and Return</h2>
      <p>
        On termination of the Account, Quiresoft will, at the Customer&rsquo;s choice, delete or
        return the personal information processed on the Customer&rsquo;s behalf, and delete
        existing copies, except to the extent retention is required by law, in accordance with the
        retention period described in Section 8 of the Privacy Policy.
      </p>

      <h2 id="audits">8. Audits and International Transfers</h2>
      <p>
        Quiresoft will make available to the Customer information reasonably necessary to
        demonstrate compliance with this DPA and will allow for and contribute to reasonable
        audits, subject to confidentiality. Where personal information is transferred across
        borders, Quiresoft relies on the lawful transfer mechanisms described in Section 7 of the
        Privacy Policy, including the Standard Contractual Clauses, which are incorporated by
        reference where applicable.
      </p>
    </LegalLayout>
  );
}
