import { PolicyLayout, PolicyNote } from "@/components/PolicyLayout";

export const metadata = { title: "Privacy Policy — ResumeFit AI" };

export default function PrivacyPage() {
  return (
    <PolicyLayout title="Privacy Policy" updated="July 2026">
      <PolicyNote>
        This is a template for planning purposes and must be reviewed by qualified legal counsel and
        adapted to your jurisdiction (e.g. GDPR, CCPA) before public launch.
      </PolicyNote>

      <h2>What we collect</h2>
      <ul>
        <li><strong>Account information</strong>: your email address and name (from sign-up or Google sign-in).</li>
        <li><strong>Content you provide</strong>: the resume text, job descriptions, and instructions you submit to tailor a resume.</li>
        <li><strong>Usage &amp; billing data</strong>: run metadata (model, tokens, cost, timestamps), plan, and credit activity.</li>
      </ul>

      <h2>How we use it</h2>
      <ul>
        <li>To provide the service — tailoring resumes and generating career documents you request.</li>
        <li>To enforce plan limits, process payments, and maintain your account.</li>
        <li>To monitor and improve reliability and cost. We do not sell your personal data.</li>
      </ul>

      <h2>Your content &amp; the &ldquo;don&apos;t save&rdquo; option</h2>
      <p>
        By default, your tailored resumes are saved to your account <strong>history</strong> so you
        can revisit them. You can turn <strong>&ldquo;Save my work to history&rdquo; off</strong> in
        your account settings — when off, your resume, job description, and results are processed for
        the request and <strong>not stored</strong>; only anonymous cost/token statistics are kept.
      </p>

      <h2>AI processing</h2>
      <p>
        To generate results, the text you submit is sent to the configured AI model provider(s) for
        processing. Review the applicable provider&apos;s data-handling terms. You may run the
        platform against a self-hosted local model to keep processing on your own infrastructure.
      </p>

      <h2>Data retention &amp; deletion</h2>
      <ul>
        <li>You can <strong>delete your history</strong> (all saved runs) at any time from your account.</li>
        <li>You can <strong>delete your account</strong>, which permanently removes your data.</li>
      </ul>

      <h2>Contact</h2>
      <p>For privacy questions or data requests, contact your configured support email.</p>
    </PolicyLayout>
  );
}
