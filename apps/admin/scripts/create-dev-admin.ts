// Creates the development Admin for the seeded Clinic if missing: pnpm admin:create-dev
import { eq, getDb, schema } from "@tsami/db";

import { DEV_ADMIN } from "../src/lib/dev-admin";
import { adminAccounts } from "../src/server/auth";

if (process.env.NODE_ENV === "production") {
  console.error("Refusing to create the development Admin in production.");
  process.exit(1);
}

const db = getDb();
const [existing] = await db
  .select({ id: schema.admin.id })
  .from(schema.admin)
  .where(eq(schema.admin.email, DEV_ADMIN.email));
if (existing) {
  console.log(`Development Admin <${DEV_ADMIN.email}> already exists.`);
} else {
  const [clinic] = await db
    .select({ id: schema.clinic.id })
    .from(schema.clinic)
    .where(eq(schema.clinic.handle, DEV_ADMIN.clinicHandle));
  if (!clinic) {
    console.error(`No Clinic "${DEV_ADMIN.clinicHandle}"; run pnpm db:seed first.`);
    process.exit(1);
  }
  await adminAccounts.create({ ...DEV_ADMIN, clinicId: clinic.id });
  console.log(`Created development Admin <${DEV_ADMIN.email}>`);
}
process.exit(0);
