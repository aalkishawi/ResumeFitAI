// ---------------------------------------------------------------------------
// Pluggable transactional email. In dev (no provider configured) the message is
// logged to the server console so flows can be tested without signing up for a
// service. In production, set RESEND_API_KEY to send real email. SMTP can be
// added here later without changing callers.
// ---------------------------------------------------------------------------

const FROM = process.env.EMAIL_FROM || "ResumeFit AI <onboarding@resend.dev>";

async function send(to: string, subject: string, text: string, html: string): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (key) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from: FROM, to, subject, text, html }),
      });
      if (!res.ok) console.error("[email] Resend error:", res.status, await res.text().catch(() => ""));
    } catch (err) {
      console.error("[email] send failed:", err);
    }
    return;
  }
  // Dev fallback — no provider configured.
  console.log(`\n[email] To: ${to}\n[email] Subject: ${subject}\n${text}\n`);
}

export async function sendPasswordResetEmail(to: string, link: string): Promise<void> {
  const subject = "Reset your ResumeFit AI password";
  const text = `Reset your password using this link (valid for 1 hour):\n\n${link}\n\nIf you didn't request this, you can safely ignore this email.`;
  const html = `<p>Reset your ResumeFit AI password using the link below (valid for 1 hour):</p>
<p><a href="${link}">${link}</a></p>
<p>If you didn't request this, you can safely ignore this email.</p>`;
  await send(to, subject, text, html);
}
