"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signup } from "@/lib/auth";
import { ApiError } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { InputField, SelectField } from "@/components/ui/Fields";
import { Banner } from "@/components/ui/Banner";
import { Card } from "@/components/ui/Card";

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!role) {
      setError("Please choose a role.");
      return;
    }

    setIsSubmitting(true);
    try {
      await signup({
        full_name: fullName,
        email,
        password,
        role: role as "manager" | "qa" | "developer",
      });
      router.push("/login?signedUp=1");
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
          Create your account
        </h1>
        <p className="mt-1 text-xs text-ink-soft sm:text-sm md:text-base">
          Having an account doesn&apos;t grant access to any project yet — a manager adds you
          once you&apos;re needed.
        </p>

        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3 sm:mt-6 sm:gap-4 md:gap-5">
          <InputField
            label="Full name"
            id="full_name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            autoComplete="name"
          />
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
              minLength={8}
              autoComplete="new-password"
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

          <SelectField
            label="Role"
            id="role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="Choose a role"
            options={[
              { value: "manager", label: "Manager" },
              { value: "qa", label: "QA" },
              { value: "developer", label: "Developer" },
            ]}
            required
          />

          {error && <Banner variant="error">{error}</Banner>}

          <Button type="submit" isLoading={isSubmitting} className="mt-2 w-full py-2.5 text-sm sm:py-3 sm:text-base">
            Create account
          </Button>
        </form>

        <p className="mt-4 text-center text-xs text-ink-soft sm:mt-6 sm:text-sm">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-ink underline hover:text-ink/80">
            Log in
          </Link>
        </p>
      </Card>
    </div>
  );
}