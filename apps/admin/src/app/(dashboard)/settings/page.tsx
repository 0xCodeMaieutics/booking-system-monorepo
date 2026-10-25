import { serverCaller } from "@/server/caller";

import { SettingsForm } from "./page.client";

export default async function SettingsPage() {
  const settings = await (await serverCaller()).settings.get();
  return <SettingsForm key={settings.updatedAt.getTime()} initial={settings} />;
}
