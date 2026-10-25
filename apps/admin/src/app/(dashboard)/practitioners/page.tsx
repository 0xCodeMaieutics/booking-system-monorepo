import { Avatar, Card, CardContent } from "@tsami/ui";
import Link from "next/link";

import { serverCaller } from "@/server/caller";

import { CreatePractitionerButton } from "./page.client";

export default async function PractitionersPage() {
  const api = await serverCaller();
  const [practitioners, treatments] = await Promise.all([api.practitioners.list(), api.treatments.list()]);
  const treatmentName = new Map(treatments.map((t) => [t.id, t.nameKa]));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl">სპეციალისტები</h1>
        <CreatePractitionerButton sortOrder={practitioners.length} />
      </div>
      <div className="grid gap-3">
        {practitioners.map((p) => (
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
