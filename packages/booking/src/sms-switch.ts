import { type DbOrTx, schema } from "@tsami/db";

const { tsamiSettings } = schema;

/** Whether SMS is switched off for all of Tsami (ADR 0010). */
export async function isSmsDisabled(db: DbOrTx): Promise<boolean> {
  const [row] = await db.select({ at: tsamiSettings.smsDisabledAt }).from(tsamiSettings);
  return !!row?.at;
}

/** Switches SMS off or on for all of Tsami. Returns false when it already was. */
export async function setSmsDisabled(db: DbOrTx, disabled: boolean, now: Date): Promise<boolean> {
  if ((await isSmsDisabled(db)) === disabled) return false;
  const smsDisabledAt = disabled ? now : null;
  await db
    .insert(tsamiSettings)
    .values({ id: 1, smsDisabledAt })
    .onConflictDoUpdate({ target: tsamiSettings.id, set: { smsDisabledAt } });
  return true;
}
