import { Card, CardContent } from "@tsami/ui";
import Link from "next/link";

import { serverCaller } from "@/server/caller";

import { PatientSearch } from "./page.client";

export default async function PatientsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const query = q.trim();
  const api = await serverCaller();
  const results = query.length >= 2 ? await api.patients.search({ q: query }) : await api.patients.recent();

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <h1 className="text-3xl">პაციენტები</h1>
      <PatientSearch initialQuery={q}>
        {results.length === 0 && <p className="text-ink-soft">ვერ მოიძებნა.</p>}
        {results.map((p) => (
          <Link key={p.id} href={`/patients/${p.id}`}>
            <Card size="sm" className="hover:ring-brand">
              <CardContent>
                <p className="font-medium">{p.fullName}</p>
                <p className="text-sm text-ink-soft">{p.phone}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </PatientSearch>
    </div>
  );
}
