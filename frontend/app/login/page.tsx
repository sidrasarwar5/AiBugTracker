"use client";

import { Suspense, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { dashboardPathForRole } from "@/lib/auth";
import { ApiError } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { InputField } from "@/components/ui/Fields";
import { Banner } from "@/components/ui/Banner";
import { Card } from "@/components/ui/Card";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const justSignedUp = searchParams.get("signedUp") === "1";

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const profile = await login(email, password);
      router.push(dashboardPathForRole(profile.role));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4 py-8 sm:px-6 md:px-8">
      <Card className="w-full max-w-sm p-4 sm:p-6 md:p-8">
        <h1 className="font-display text-xl font-semibold text-ink sm:text-2xl md:text-3xl">
          Log in
        </h1>
        <p className="mt-1 text-xs text-ink-soft sm:text-sm md:text-base">
          One login for every role — you&apos;ll land on the right dashboard automatically.
        </p>

        {justSignedUp && (
          <div className="mt-4">
            <Banner variant="success">Account created. Log in to continue.</Banner>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3 sm:mt-6 sm:gap-4 md:gap-5">
          <InputField
            label="Email"
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          
          <div className="relative">
            <InputField
              label="Password"
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-8.5 text-sm text-ink-soft hover:text-ink transition-colors"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>

          {error && <Banner variant="error">{error}</Banner>}

          <Button type="submit" isLoading={isSubmitting} className="mt-2 w-full py-2.5 text-sm sm:py-3 sm:text-base">
            Log in
          </Button>
        </form>

        <p className="mt-4 text-center text-xs text-ink-soft sm:mt-6 sm:text-sm">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-medium text-ink underline hover:text-ink/80">
            Sign up
          </Link>
        </p>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-paper px-4">
          <p className="font-mono text-sm text-ink-soft">Loading…</p>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}