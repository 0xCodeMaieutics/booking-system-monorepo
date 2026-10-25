"use client";

import { useMutation } from "@tanstack/react-query";
import { Button } from "@tsami/ui";
import { useRouter } from "next/navigation";

import { useTRPC } from "@/trpc/client";

export function CreatePractitionerButton({ sortOrder }: { sortOrder: number }) {
  const trpc = useTRPC();
  const router = useRouter();
  const create = useMutation(
    trpc.practitioners.create.mutationOptions({ onSuccess: (p) => router.push(`/practitioners/${p.id}`) }),
  );

  return (
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
          sortOrder,
          treatmentIds: [],
        })
      }
    >
      დამატება
    </Button>
  );
}
