"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { Avatar, Button, Card, CardContent } from "@tsami/ui";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { useTRPC } from "@/trpc/client";

export default function PractitionersPage() {
  const trpc = useTRPC();
  const router = useRouter();
  const practitioners = useQuery(trpc.practitioners.list.queryOptions());
  const treatments = useQuery(trpc.treatments.list.queryOptions());
  const create = useMutation(
    trpc.practitioners.create.mutationOptions({ onSuccess: (p) => router.push(`/practitioners/${p.id}`) }),
  );
  const treatmentName = new Map(treatments.data?.map((t) => [t.id, t.nameKa]));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl">სპეციალისტები</h1>
        <Button
          type="button"
          size="lg"
          disabled={create.isPending}
          onClick={() =>
            create.mutate({
              nameKa: "ახალი სპეციალისტი",
              nameEn: "New practitioner",
              titleKa: null,
              titleEn: null,
              sortOrder: practitioners.data?.length ?? 0,
              treatmentIds: [],
            })
          }
        >
          დამატება
        </Button>
      </div>
      <div className="grid gap-3">
        {practitioners.data?.map((p) => (
          <Link key={p.id} href={`/practitioners/${p.id}`}>
            <Card size="sm" className={`hover:ring-brand ${p.archivedAt ? "opacity-50" : ""}`}>
              <CardContent className="flex items-center gap-4">
                <Avatar src={p.photoUrl} name={p.nameKa} />
                <div>
                  <p className="font-medium">
                    {p.titleKa ? `${p.titleKa} ` : ""}
                    {p.nameKa} {p.archivedAt && "· დაარქივებული"}
                  </p>
                  <p className="text-sm text-ink-soft">
                    {p.treatmentIds.map((id) => treatmentName.get(id)).join(", ") ||
                      "პროცედურები არ არის მითითებული"}
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
