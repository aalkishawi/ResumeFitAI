import { isGoogleConfigured } from "@/auth";
import { AuthCard } from "@/components/auth/AuthCard";
import { SignUpForm } from "@/components/auth/SignUpForm";

export const metadata = { title: "Sign up — ResumeFit AI" };

export default function SignUpPage() {
  return (
    <AuthCard
      title="Create your account"
      subtitle="Start tailoring resumes — 3 free every month, no card required."
    >
      <SignUpForm googleEnabled={isGoogleConfigured()} />
    </AuthCard>
  );
}
