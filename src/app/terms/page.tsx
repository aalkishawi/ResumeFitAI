import { PolicyLayout, PolicyNote } from "@/components/PolicyLayout";

export const metadata = { title: "Terms of Service — ResumeFit AI" };

export default function TermsPage() {
  return (
    <PolicyLayout title="Terms of Service" updated="July 2026">
      <PolicyNote>
        This is a template for planning purposes and must be reviewed by qualified legal counsel
        before public launch.
      </PolicyNote>

      <h2>Acceptable use</h2>
      <p>
        You agree to use ResumeFit AI to present your <strong>real</strong> experience. You must not
        use it to fabricate qualifications or knowingly misrepresent your background. See our{" "}
        <a href="/ethics">Ethical Use &amp; Truthfulness</a> policy.
      </p>

      <h2>Accounts</h2>
      <p>You are responsible for activity under your account and for keeping your credentials secure.</p>

      <h2>Plans, credits &amp; billing</h2>
      <ul>
        <li>Paid plans and credit purchases are billed through our payment processor.</li>
        <li>Credits are consumed per run as described in the app; some modes cost more.</li>
        <li>You can manage or cancel a subscription from the billing page at any time.</li>
      </ul>

      <h2>No guarantees</h2>
      <p>
        The service improves resume clarity, ATS compatibility, and job alignment. It does{" "}
        <strong>not guarantee a job, an interview, or that any resume will pass a specific applicant
        tracking system</strong>. AI output may contain errors — you are responsible for reviewing
        and verifying all generated content before use.
      </p>

      <h2>Limitation of liability</h2>
      <p>
        The service is provided &ldquo;as is.&rdquo; To the maximum extent permitted by law, we are
        not liable for indirect or consequential damages arising from your use of the service.
      </p>

      <h2>Changes</h2>
      <p>We may update these terms; continued use after an update constitutes acceptance.</p>
    </PolicyLayout>
  );
}
