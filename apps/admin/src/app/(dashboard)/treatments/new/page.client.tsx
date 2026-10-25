"use client";

import { useRouter } from "next/navigation";

import { TreatmentForm } from "@/components/treatment-form";

export function NewTreatmentForm({ sortOrder }: { sortOrder: number }) {
  const router = useRouter();
  return <TreatmentForm sortOrder={sortOrder} onDone={() => router.push("/treatments")} />;
}
