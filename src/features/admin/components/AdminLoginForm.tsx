"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Eye, EyeOff, Leaf, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AdminLoginInput,
  adminLoginSchema,
} from "@/features/admin/validations/admin-login.validation";
import { authClient } from "@/lib/auth-client";

export function AdminLoginForm() {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<AdminLoginInput>({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(input: AdminLoginInput) {
    setErrorMessage(null);

    const result = await authClient.signIn.email({
      email: input.email,
      password: input.password,
      callbackURL: "/admin",
    });

    if (result.error) {
      setErrorMessage(result.error.message ?? "Unable to sign in.");
      return;
    }

    router.replace("/admin");
    router.refresh();
  }

  return (
    <div className="grid w-full max-w-4xl overflow-hidden rounded-xl border border-border bg-white lg:grid-cols-12">
      {/* Grounding Operations Panel */}
      <div className="flex flex-col justify-between gap-8 bg-[#1F4E37] p-7 text-[#FCFBF8] sm:p-10 lg:col-span-5">
        <div className="space-y-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-md border border-white/20 bg-white/10">
              <Leaf className="h-4 w-4 text-[#FCFBF8]" />
            </div>
            <div>
              <p className="font-display text-base font-medium leading-tight tracking-tight">
                Nature&apos;s Nectar
              </p>
              <p className="text-[11px] tracking-[0.04em] text-[#FCFBF8]/75 uppercase">
                Operations Console
              </p>
            </div>
          </div>

          <div className="space-y-2.5 pt-2">
            <h1 className="font-display text-2xl font-medium tracking-tight text-white sm:text-[1.75rem] sm:leading-[1.2]">
              Storefront &amp; Fulfillment Desk
            </h1>
            <p className="text-sm leading-relaxed text-[#FCFBF8]/80">
              Manage herbal formulations, verify M-Pesa references, quote
              countrywide deliveries, and keep stock levels current.
            </p>
          </div>
        </div>

        <div className="space-y-4 border-t border-white/15 pt-5">
          <div className="flex items-center gap-2 text-xs text-[#FCFBF8]/85">
            <ShieldCheck className="h-4 w-4 shrink-0 text-[#FCFBF8]/90" />
            <span>Protected BetterAuth operator session</span>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-white underline-offset-4 hover:underline"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Return to storefront
          </Link>
        </div>
      </div>

      {/* Credential Form Panel */}
      <div className="flex flex-col justify-center p-6 sm:p-10 lg:col-span-7">
        <div className="mb-6 space-y-1.5">
          <p className="text-xs font-medium tracking-[0.04em] text-primary uppercase">
            Operator Access
          </p>
          <h2 className="font-display text-2xl font-medium tracking-tight text-foreground">
            Sign in to Admin
          </h2>
          <p className="text-sm text-muted-foreground">
            Enter your authorized email and password to continue.
          </p>
        </div>

        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground" htmlFor="email">
              Email address
            </label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              className="h-11 bg-white"
              placeholder="you@example.com"
              {...form.register("email")}
            />
            {form.formState.errors.email ? (
              <p className="text-xs text-destructive">
                {form.formState.errors.email.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <label
              className="text-sm font-medium text-foreground"
              htmlFor="password"
            >
              Password
            </label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                className="h-11 bg-white pr-10"
                {...form.register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded text-muted-foreground hover:text-foreground"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {form.formState.errors.password ? (
              <p className="text-xs text-destructive">
                {form.formState.errors.password.message}
              </p>
            ) : null}
          </div>

          {errorMessage ? (
            <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-3.5 py-2.5 text-xs font-medium text-destructive">
              {errorMessage}
            </div>
          ) : null}

          <Button
            className="h-11 w-full"
            type="submit"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? "Signing in..." : "Sign in"}
          </Button>
        </form>
      </div>
    </div>
  );
}
