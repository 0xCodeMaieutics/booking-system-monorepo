"use client";

import { Button, Card, CardContent, Field, FieldDescription, FieldLabel, Input } from "@tsami/ui";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { type FormEvent, Suspense, useId, useState } from "react";

import { authClient } from "@/lib/auth-client";

function SetPasswordForm() {
  const fieldId = useId();
  const params = useSearchParams();
  const token = params.get("token");
  const [password, setPassword] = useState("");
  const [state, setState] = useState<"idle" | "done" | "error">("idle");

  if (!token || params.get("error")) {
    return <p>ბმული არასწორია ან ვადაგასულია. მოითხოვეთ ახალი.</p>;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const { error } = await authClient.resetPassword({ newPassword: password, token: token! });
    setState(error ? "error" : "done");
  }

  if (state === "done") {
    return (
      <p>
        პაროლი დაყენებულია.{" "}
        <Link href="/sign-in" className="underline">
          შესვლა
        </Link>
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <h1 className="text-2xl">პაროლის დაყენება</h1>
      <Field>
        <FieldLabel htmlFor={`${fieldId}-1`}>ახალი პაროლი</FieldLabel>
        <Input
          id={`${fieldId}-1`}
          type="password"
          required
          minLength={10}
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <FieldDescription>მინიმუმ 10 სიმბოლო</FieldDescription>
      </Field>
      {state === "error" && <p className="text-sm text-danger">ბმული ვადაგასულია. მოითხოვეთ ახალი.</p>}
      <Button size="lg" type="submit">
        შენახვა
      </Button>
    </form>
  );
}

export default function SetPasswordPage() {
  return (
    <Card>
      <CardContent>
        <Suspense>
          <SetPasswordForm />
        </Suspense>
      </CardContent>
    </Card>
  );
}
