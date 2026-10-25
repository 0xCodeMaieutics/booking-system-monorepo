"use client";

import { Button, Card, CardContent, Field, FieldLabel, Input } from "@tsami/ui";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useId, useState } from "react";

import { authClient } from "@/lib/auth-client";

export default function SignInPage() {
  const fieldId = useId();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string>();
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(undefined);
    const result = await authClient.signIn.email({ email, password });
    setPending(false);
    if (result.error) {
      setError(
        result.error.code === "ADMIN_DEACTIVATED"
          ? "ანგარიში დეაქტივირებულია."
          : result.error.status === 401
            ? "ელფოსტა ან პაროლი არასწორია."
            : "შესვლა ვერ მოხერხდა. სცადეთ თავიდან.",
      );
      return;
    }
    router.replace("/");
    router.refresh();
  }

  return (
    <Card>
      <CardContent>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <h1 className="text-2xl">შესვლა</h1>
          <Field>
            <FieldLabel htmlFor={`${fieldId}-1`}>ელფოსტა</FieldLabel>
            <Input
              id={`${fieldId}-1`}
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor={`${fieldId}-2`}>პაროლი</FieldLabel>
            <Input
              id={`${fieldId}-2`}
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>
          {error && <p className="text-sm text-danger">{error}</p>}
          <Button size="lg" type="submit" disabled={pending}>
            შესვლა
          </Button>
          <Link href="/forgot-password" className="text-sm text-ink-soft hover:text-ink">
            დაგავიწყდათ პაროლი?
          </Link>
        </form>
      </CardContent>
    </Card>
  );
}
