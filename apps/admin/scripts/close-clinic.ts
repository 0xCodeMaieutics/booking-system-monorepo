// Marks a Clinic Closed: pnpm clinic:close <handle>
// Its Booking Site stops taking Bookings; Manage Links and Admin sign-in keep working.
import { and, eq, getDb, isNull, schema } from "@tsami/db";

const [handle] = process.argv.slice(2);
if (!handle) {
  console.error("Usage: pnpm clinic:close <handle>");
  process.exit(1);
}

const [closed] = await getDb()
  .update(schema.clinic)
  .set({ closedAt: new Date() })
  .where(and(eq(schema.clinic.handle, handle), isNull(schema.clinic.closedAt)))
  .returning({ nameEn: schema.clinic.nameEn });
if (!closed) {
  console.error(`No open Clinic with the Handle "${handle}".`);
  process.exit(1);
}
console.log(`Closed ${closed.nameEn}.`);
process.exit(0);
