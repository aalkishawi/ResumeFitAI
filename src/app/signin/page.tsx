import { Suspense } from "react";
import { isGoogleConfigured } from "@/auth";
import { AuthCard } from "@/components/auth/AuthCard";
import { SignInForm } from "@/components/auth/SignInForm";

export const metadata = { title: "Sign in — ResumeFit AI" };

export default function SignInPage() {
  return (
    <AuthCard title="Welcome back" subtitle="Sign in to your ResumeFit AI account.">
      <Suspense fallback={null}>
        <SignInForm googleEnabled={isGoogleConfigured()} />
      </Suspense>
    </AuthCard>
  );
}
