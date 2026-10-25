"use client";

import { Button } from "@tsami/ui";
import { useEffect } from "react";

export default function DashboardError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => console.error(error), [error]);

  return (
    <div className="flex flex-col items-start gap-3">
      <p className="text-danger">შეცდომა. სცადეთ თავიდან.</p>
      <Button type="button" variant="outline" onClick={retry}>
        თავიდან ცდა
      </Button>
    </div>
  );
}
