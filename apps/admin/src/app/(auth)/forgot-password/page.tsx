"use client";

import { Button, Card, CardContent, Field, FieldLabel, Input } from "@tsami/ui";
import Link from "next/link";
import { type FormEvent, useId, useState } from "react";

import { authClient } from "@/lib/auth-client";

export default function ForgotPasswordPage() {
  const fieldId = useId();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    await authClient.requestPasswordReset({ email, redirectTo: `${window.location.origin}/set-password` });
    setSent(true);
  }

  return (
    <Card>
      <CardContent>
        {sent ? (
          <p>თუ ეს ელფოსტა რეგისტრირებულია, მასზე გამოგიგზავნეთ პაროლის აღდგენის ბმული.</p>
        ) : (
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <h1 className="text-2xl">პაროლის აღდგენა</h1>
            <Field>
              <FieldLabel htmlFor={`${fieldId}-1`}>ელფოსტა</FieldLabel>
              <Input
                id={`${fieldId}-1`}
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Field>
            <Button size="lg" type="submit">
              ბმულის გაგზავნა
            </Button>
            <Link href="/sign-in" className="text-sm text-ink-soft hover:text-ink">
              შესვლაზე დაბრუნება
            </Link>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
