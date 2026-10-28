"use client";

import { Button } from "@tsami/ui";

import { type Locale, dictionaries } from "@/i18n";
import { useTRPC } from "@/trpc/client";
import { useRefreshingMutation } from "@/trpc/use-refreshing-mutation";

export function CancelAppointment({
  locale,
  handle,
  token,
}: {
  locale: Locale;
  handle: string;
  token: string;
}) {
  const t = dictionaries[locale];
  const trpc = useTRPC();
  const cancel = useRefreshingMutation(trpc.cancel.mutationOptions());

  return (
    <>
      <Button
        type="button"
        size="lg"
        variant="destructive"
        disabled={cancel.isPending}
        onClick={() => {
          if (window.confirm(t.manage.confirmCancel)) cancel.mutate({ handle, token });
        }}
      >
        {t.manage.cancel}
      </Button>
      {cancel.isError && <p className="text-sm text-danger">{t.errors.generic}</p>}
    </>
  );
}
