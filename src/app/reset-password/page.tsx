import { Suspense } from "react";
import { AuthCard } from "@/components/auth/AuthCard";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export const metadata = { title: "Set a new password — ResumeFit AI" };

export default function ResetPasswordPage() {
  return (
    <AuthCard title="Choose a new password" subtitle="Enter a new password for your account.">
      <Suspense fallback={null}>
        <ResetPasswordForm />
      </Suspense>
    </AuthCard>
  );
}
