import { serverCaller } from "@/server/caller";

import { AdminsManager } from "./page.client";

export default async function AdminsPage() {
  const api = await serverCaller();
  const [me, admins] = await Promise.all([api.me(), api.admins.list()]);
  return <AdminsManager meId={me.id} admins={admins} />;
}
