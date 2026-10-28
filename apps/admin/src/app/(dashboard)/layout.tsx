import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { Nav } from "@/components/nav";
import { auth } from "@/server/auth";
import { serverCaller } from "@/server/caller";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.deactivatedAt) redirect("/sign-in");
  const clinic = await (await serverCaller()).clinic();

  return (
    <div className="flex min-h-dvh flex-col md:flex-row">
      <Nav adminName={session.user.name} clinicName={clinic.nameKa} />
      <main className="flex-1 px-6 py-8 md:px-10">
        {!clinic.smsAvailable && (
          <p className="mb-6 rounded-lg border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
            SMS დროებით გამორთულია. პაციენტებს შეტყობინებები ელფოსტით მიდის; ვისაც ელფოსტა არ აქვს,
            შეტყობინებას ვერ მიიღებს — დაურეკეთ.
          </p>
        )}
        {children}
      </main>
    </div>
  );
}
