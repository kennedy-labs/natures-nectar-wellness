"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Leaf } from "lucide-react";
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
    <div className="w-full max-w-md rounded-xl border border-border/80 bg-white p-6 sm:p-8">
      <div className="mb-6 space-y-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Leaf className="h-5 w-5" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">Admin Sign In</h1>
        <p className="text-sm text-muted-foreground">
          Manage your Nature&apos;s Nectar Wellness catalog, photos, and orders.
        </p>
      </div>

      <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
        <div className="space-y-1.5">
          <label className="text-sm font-medium" htmlFor="email">
            Email address
          </label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            className="h-11"
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
          <label className="text-sm font-medium" htmlFor="password">
            Password
          </label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              className="h-11 pr-10"
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
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">
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

        <div className="pt-2 text-center">
          <Link
            href="/"
            className="text-xs font-medium text-muted-foreground hover:text-foreground hover:underline"
          >
            ← Return to storefront
          </Link>
        </div>
      </form>
    </div>
  );
}
