import { PolicyLayout } from "@/components/PolicyLayout";

export const metadata = { title: "Ethical Use & Truthfulness — ResumeFit AI" };

export default function EthicsPage() {
  return (
    <PolicyLayout title="Ethical Use & Truthfulness" updated="July 2026">
      <p>
        ResumeFit AI is an <strong>honest career assistant</strong>. Our purpose is to help you
        present your <strong>real</strong> experience more clearly and in better alignment with a
        specific job — never to fabricate qualifications or deceive employers.
      </p>

      <h2>Our truthfulness commitment</h2>
      <ul>
        <li>The tailored resume and every generated document are grounded only in the content of your original resume.</li>
        <li>We do not invent employers, job titles, dates, degrees, certifications, metrics, or skills.</li>
        <li>Every run includes a <strong>truthfulness check</strong> that flags claims not supported by your original resume and suggests honest alternatives.</li>
        <li>We reframe, reorganize, and clarify — we do not manufacture experience you don&apos;t have.</li>
      </ul>

      <h2>What we help you do</h2>
      <ul>
        <li>Improve ATS compatibility and machine-readability.</li>
        <li>Increase alignment with a job description using language you genuinely qualify for.</li>
        <li>Identify missing or underused keywords so you can decide what truthfully applies.</li>
        <li>Improve clarity, structure, and recruiter readability, and prepare for interviews.</li>
      </ul>

      <h2>What we will not do</h2>
      <p>
        We do not position this product as a way to &ldquo;beat&rdquo; or &ldquo;trick&rdquo;
        applicant tracking systems, guarantee a job or an interview, or bypass employer screening.
        Using the platform to knowingly misrepresent your background is a violation of these terms.
      </p>

      <h2>Your responsibility</h2>
      <p>
        AI-generated content can contain errors. <strong>Always review every generated resume,
        cover letter, and other document before you use it</strong> and confirm that every statement
        is accurate and reflects your real experience. You are responsible for the content you submit
        to employers.
      </p>
    </PolicyLayout>
  );
}
