"use client";

import { Button, Card, Field, Input } from "@tsami/ui";
import Link from "next/link";
import { type FormEvent, useState } from "react";

import { authClient } from "@/lib/auth-client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    await authClient.requestPasswordReset({ email, redirectTo: `${window.location.origin}/set-password` });
    setSent(true);
  }

  return (
    <Card>
      {sent ? (
        <p>თუ ეს ელფოსტა რეგისტრირებულია, მასზე გამოგიგზავნეთ პაროლის აღდგენის ბმული.</p>
      ) : (
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <h1 className="text-2xl">პაროლის აღდგენა</h1>
          <Field label="ელფოსტა">
            <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Button type="submit">ბმულის გაგზავნა</Button>
          <Link href="/sign-in" className="text-sm text-ink-soft hover:text-ink">
            შესვლაზე დაბრუნება
          </Link>
        </form>
      )}
    </Card>
  );
}
